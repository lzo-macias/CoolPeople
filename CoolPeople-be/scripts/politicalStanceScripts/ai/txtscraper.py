import os
import re
import asyncio
import hashlib
import sys
import json
from urllib.parse import urlparse, urljoin
from collections import defaultdict

from bs4 import BeautifulSoup
import requests
from playwright.async_api import async_playwright
import random

# --- Configuration ---
ISSUE_KEYWORDS = {
    "Affordable Housing": [
      'affordable housing', 'rent', 'tenant', 'nycha', 'eviction', 'rezoning',
      'public housing', 'housing assistance', 'low-income housing', 'rental subsidy',
      'housing crisis', 'HUD', 'section 8', 'voucher', 'shelter', 'homelessness',
      'rent stabilized', 'landlord', 'tenant rights', 'housing insecurity'
    ],
    "Policing & Public Safety": [
      'nypd', 'police', 'public safety', 'crime', 'gun violence', 'stop-and-frisk',
      'crime victims', 'victim services', 'advocate', 'criminal justice', 'parole',
      'probation', 'incarceration', 'jail', 'prison', 'body camera', 'bail reform',
      'use of force', 'law enforcement', 'reentry program', 'police misconduct'
    ],
    "Education": [
      'school', 'education', 'doe', 'teachers', 'students', 'charter school', 'prek',
      'curriculum', 'discipline', 'public school', 'school safety', 'student services',
      'teacher training', 'after school', 'sex ed', 'learning standards', 'K-12', 'higher education'
    ],
    "Public Transit": [
      'mta', 'subway', 'bus', 'transit', 'commute', 'infrastructure',
      'transportation', 'metrocard', 'fare', 'rail', 'station', 'accessibility',
      'transit desert', 'electric bus', 'zero-emission bus', 'transport access'
    ],
    "Climate & Environment": [
      'climate', 'green', 'environment', 'resiliency', 'sustainability', 'flood',
      'renewable', 'carbon', 'emissions', 'solar', 'wind', 'clean energy',
      'pollution', 'climate change', 'air quality', 'offshore wind', 'wetlands',
      'recycling', 'battery storage', 'building electrification', 'fossil fuel'
    ],
    "Immigration": [
      'immigrant', 'asylum', 'migrant', 'ICE', 'border', 'citizenship',
      'deportation', 'undocumented', 'residency', 'naturalization', 'refugee',
      'green card', 'daca', 'immigration services', 'resettlement', 'language access'
    ],
    "LGBTQ+ Rights": [
      'lgbt', 'queer', 'gay', 'trans', 'pride', 'nonbinary',
      'gender identity', 'gender affirming', 'same-sex', 'conversion therapy',
      'lgbtq youth', 'transition care', 'discrimination', 'drag ban', 'hormone therapy'
    ],
    "Economic Development": [
      'jobs', 'small business', 'economy', 'workforce', 'economic development',
      'entrepreneurship', 'tax credit', 'minimum wage', 'job training',
      'startup', 'employment program', 'hiring incentive', 'local investment'
    ],
    "Homelessness": [
      'homeless', 'shelter', 'housing insecurity', 'unsheltered', 'mental health',
      'transitional housing', 'supportive housing', 'emergency shelter',
      'street outreach', 'wraparound services', 'encampment', 'hygiene center'
    ],
    "Health Care Access": [
      'healthcare', 'insurance', 'pre-authorization', 'coverage', 'treatment',
      'transplant', 'patient', 'organ', 'opioid', 'overdose', 'narcan',
      'substance use', 'mental health', 'reproductive health', 'abortion',
      'medicare', 'medicaid', 'public health', 'aid in dying', 'behavioral health',
      'universal healthcare'
    ],
    "Veterans & Military": [
      'veteran', 'military', 'service', 'medal', 'armed forces', 'deployment',
      'discharge', 'GI bill', 'ptsd', 'veterans affairs', 'vets', 'honorably discharged',
      'service-connected', 'veterans health', 'military spouse'
    ],
    "Government & Ethics": [
      'compensation', 'legislature', 'salary', 'ethics', 'accountability', 'pay',
      'public official', 'conflict of interest', 'lobbyist', 'transparency',
      'procurement', 'compliance', 'whistleblower', 'public integrity'
    ],
    "Elections & Democracy": [
      'petition', 'election', 'ballot', 'candidate', 'vote', 'signature', 'democracy',
      'redistricting', 'ranked choice', 'early voting', 'poll site', 'voter ID',
      'election security', 'campaign finance', 'get out the vote', 'gerrymandering'
    ],
    "Civil Rights & Discrimination": [
      'statue', 'monument', 'historic', 'memorial', 'desecration', 'heritage',
      'civil rights', 'racial justice', 'equity', 'segregation', 'reparations',
      'discrimination', 'commemoration', 'historic site', 'injustice', 'diversity'
    ]
  }
EXCLUDED_DOMAIN = 'nyccfb'
PARKED_KEYWORDS = ['buy this domain', 'this domain is for sale', 'site not found', '404', 'domain parking']

visited = set()
scraped_text_hashes = set()

def chunk_text(text, max_tokens=750):
    words = text.split()
    return [' '.join(words[i:i+max_tokens]) for i in range(0, len(words), max_tokens)]

# --- Utility Functions ---
def is_valid_first_level(url, candidate_name):
    try:
        parsed = urlparse(url)
        domain = parsed.hostname.lower() if parsed.hostname else ''
        if EXCLUDED_DOMAIN in domain:
            return False
        if domain.endswith('.gov'):
            return True
        name_parts = re.findall(r'\w+', candidate_name.lower())
        return any(part in domain for part in name_parts)
    except Exception:
        return False

def is_internal_or_gov(link, base_url, candidate_name=''):
    try:
        link = link.lower()
        candidate_parts = re.findall(r'\w+', candidate_name.lower())
        link_host = urlparse(link).hostname or ''
        if 'legistar.council.nyc.gov' in link:
            return False
        if 'council.nyc.gov' in link_host:
            return any(part in link for part in candidate_parts)
        if link_host.endswith('.gov') and EXCLUDED_DOMAIN not in link_host:
            return True
        return any(part in link_host for part in candidate_parts)
    except Exception:
        return False

def parse_html_and_links(soup, url):
    text = ' '.join(el.get_text(separator=' ', strip=True) for el in soup.select('p, h1, h2, h3, h4, h5, h6, li, td, span, article'))
    if any(kw in text.lower() for kw in PARKED_KEYWORDS):
        return '', []
    base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
    links = [urljoin(base_url, a.get('href')) for a in soup.find_all('a', href=True)]
    return text.strip(), list(set(link for link in links if link.startswith('http')))

def is_external_domain(url, base_url):
    return urlparse(url).netloc != urlparse(base_url).netloc

async def extract_text_and_links(url, page):
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 403 or 'text/html' not in res.headers.get('Content-Type', ''):
            return await extract_with_playwright(url, page)
        soup = BeautifulSoup(res.text, 'html.parser')
    except:
        return await extract_with_playwright(url, page)
    return parse_html_and_links(soup, url)

async def extract_with_playwright(url, page):
    try:
        await page.goto(url, timeout=15000)
        content = await page.content()
        soup = BeautifulSoup(content, 'html.parser')
        return parse_html_and_links(soup, url)
    except:
        return '', []

async def search_bing(candidate_name, page):
    queries = [f"{candidate_name} {issue}" for issue in ISSUE_KEYWORDS.keys()]
    all_urls = set()
    for query in [candidate_name] + queries:
        await page.goto(f'https://www.bing.com/search?q={query}')
        await page.wait_for_timeout(1500)
        elements = await page.query_selector_all('li.b_algo a')
        for el in elements:
            href = await el.get_attribute('href')
            if href:
                all_urls.add(href)
    return list(all_urls)

async def scrape_link(url, context, output, candidate_name):
    try:
        name_parts = re.findall(r'\w+', candidate_name.lower())
        if not any(part in url.lower() for part in name_parts):
            return []  # ⬅️ skip if candidate name not in landing page URL

        page = await context.new_page()
        text, links = await extract_text_and_links(url, page)
        await page.close()

        if not text.strip():
            return []

        text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()
        if text_hash in scraped_text_hashes:
            return []

        scraped_text_hashes.add(text_hash)

        chunks = chunk_text(text, 750)
        for chunk in chunks:
            lower_chunk = chunk.lower()
            matched_any = False
            for category, keywords in ISSUE_KEYWORDS.items():
                score = sum(lower_chunk.count(kw) for kw in keywords)
                if score >= 2:
                    output.append({
                        "candidate": candidate_name,
                        "category": category,
                        "score": score,
                        "link": url,
                        "text": chunk
                    })
                    matched_any = True

            if not matched_any:
                output.append({
                    "candidate": candidate_name,
                    "category": "Uncategorized",
                    "score": 0,
                    "link": url,
                    "text": chunk
                })

        await asyncio.sleep(random.uniform(1.2, 3.0))
        return links
    except:
        return []

async def scrape_candidate(candidate_name):
    candidate_slug = candidate_name.replace(' ', '_')
    OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../data/textfiles3'))
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    OUTPUT_PATH = os.path.join(OUTPUT_DIR, f'{candidate_slug}.json')

    output = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        main_page = await context.new_page()

        urls = set()
        for query in [candidate_name] + [f"{candidate_name} {issue}" for issue in ISSUE_KEYWORDS.keys()]:
            print(f"🔎 Searching: {query}")
            try:
                query_urls = await search_bing(query, main_page)
                urls.update([u for u in query_urls if is_valid_first_level(u, candidate_name)])
            except Exception as e:
                print(f"⚠️ Bing search failed for query '{query}': {e}")
                continue

        filtered = [u for u in urls if is_valid_first_level(u, candidate_name)]
        campaign_site = next((u for u in filtered if any(part in urlparse(u).netloc for part in re.findall(r'\w+', candidate_name.lower()))), None)
        if campaign_site:
            filtered = [campaign_site] + [u for u in filtered if u != campaign_site]

        for url in filtered:
            if url in visited:
                continue
            visited.add(url)
            links_lvl1 = await scrape_link(url, context, output, candidate_name)

            scrape_tasks_lvl1 = []
            for link1 in links_lvl1:
                if link1 in visited or not is_internal_or_gov(link1, url, candidate_name):
                    continue
                visited.add(link1)
                scrape_tasks_lvl1.append(scrape_link(link1, context, output, candidate_name))

            second_level_links = await asyncio.gather(*scrape_tasks_lvl1)

            scrape_tasks_lvl2 = []
            for links_set in second_level_links:
                for link2 in links_set:
                    if link2 in visited or not is_internal_or_gov(link2, link2, candidate_name):
                        continue
                    if is_external_domain(link2, url):
                        continue
                    visited.add(link2)
                    scrape_tasks_lvl2.append(scrape_link(link2, context, output, candidate_name))

            await asyncio.gather(*scrape_tasks_lvl2)

        await browser.close()

        print(f"✅ Scrape complete for {candidate_name}, returning data.")
        return output, OUTPUT_PATH

if __name__ == "__main__":
    list_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../data/listofcandidates.js'))
    with open(list_path, 'r', encoding='utf-8') as f:
        content = f.read().replace('module.exports =', '').strip()
        if content.endswith(';'):
            content = content[:-1]
        candidates = json.loads(content)

    MAX_CONCURRENT = 5
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)

    async def safe_scrape(candidate):
        name = candidate.get("name")
        if not name or name == "Abreu, Shaun":
            return

        candidate_slug = name.replace(' ', '_')
        OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../data/textfiles3'))
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        OUTPUT_PATH = os.path.join(OUTPUT_DIR, f'{candidate_slug}.json')

        if os.path.exists(OUTPUT_PATH):
            print(f"⏭️ Skipping {name}, already has JSON.")
            return

        print(f"🔍 Scraping: {name}")

        try:
            async with semaphore:
                output, _ = await asyncio.wait_for(scrape_candidate(name), timeout=900)
                with open(OUTPUT_PATH, 'w', encoding='utf-8') as out_json:
                    json.dump(output, out_json, ensure_ascii=False, indent=2)
            print(f"✅ Saved final JSON for {name}")
        except asyncio.TimeoutError:
            print(f"⏱️ Timeout while processing {name}, saving partial data...")
            if 'output' in locals() and output:
                with open(OUTPUT_PATH, 'w', encoding='utf-8') as out_json:
                    json.dump(output, out_json, ensure_ascii=False, indent=2)
                print(f"⚠️ Partial data saved for {name} after timeout.")
            else:
                print(f"⚠️ No data to save for {name} after timeout.")
        except Exception as e:
            print(f"❌ Error processing {name}: {e}")

    async def main():
        await asyncio.gather(*(safe_scrape(c) for c in candidates))

    asyncio.run(main())
