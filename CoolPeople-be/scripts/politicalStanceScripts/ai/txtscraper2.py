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
# visited = set()
scraped_text_hashes = set()


def chunk_text(text, max_tokens=750):
    words = text.split()
    return [' '.join(words[i:i + max_tokens]) for i in range(0, len(words), max_tokens)]


def is_valid_first_level(url, candidate_name):
    try:
        parsed = urlparse(url)
        domain = parsed.hostname.lower() if parsed.hostname else ''
        return 'nyccfb' not in domain
    except Exception:
        return False


def parse_html_and_links(soup, url):
    text = ' '.join(el.get_text(separator=' ', strip=True) for el in soup.select('p, h1, h2, h3, h4, h5, h6, li, td, span, article'))
    if any(kw in text.lower() for kw in PARKED_KEYWORDS):
        return '', []
    base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
    links = [urljoin(base_url, a.get('href')) for a in soup.find_all('a', href=True)]
    return text.strip(), list(set(link for link in links if link.startswith('http')))


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


async def scrape_link(url, context, output, candidate_name, target_category):
    try:
        print(f"🌐 Starting scrape of: {url} for {candidate_name} [{target_category}]")

        if not any(part in url.lower() for part in re.findall(r'\w+', candidate_name.lower())):
            print(f"⚠️ Skipping URL (no candidate name in URL): {url}")
            return []

        page = await context.new_page()
        text, links = await extract_text_and_links(url, page)
        await page.close()

        if not text.strip():
            print(f"⚠️ No text found at: {url}")
            return []

        print(f"✅ Text extracted from {url} — length: {len(text)} chars")
        print(f"🔗 Found {len(links)} links on page")

        text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()
        if text_hash in scraped_text_hashes:
            print(f"⚠️ Duplicate page content at {url}, skipping.")
            return []

        scraped_text_hashes.add(text_hash)
        chunks = chunk_text(text, 750)
        print(f"📚 Split text into {len(chunks)} chunks")

        matched_chunks = 0

        for chunk in chunks:
            if target_category == "bio":
                output.append({
                    "candidate": candidate_name,
                    "category": "bio",
                    "score": None,
                    "link": url,
                    "text": chunk
                })
                matched_chunks += 1
                continue

            if target_category not in ISSUE_KEYWORDS:
                print(f"⚠️ Unknown category '{target_category}', skipping chunk match.")
                continue

            score = sum(chunk.lower().count(kw) for kw in ISSUE_KEYWORDS[target_category])
            if score >= 2:
                output.append({
                    "candidate": candidate_name,
                    "category": target_category,
                    "score": score,
                    "link": url,
                    "text": chunk
                })
                matched_chunks += 1

        print(f"🧠 {matched_chunks} relevant chunks extracted for category '{target_category}' from {url}")
        await asyncio.sleep(random.uniform(1.0, 2.5))
        return links

    except Exception as e:
        print(f"❌ Exception while scraping {url}: {str(e)}")
        return []


# async def scrape_candidate(candidate_name, category):
#     # visited = set()
#     slug = candidate_name.replace(' ', '_')
#     OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../data/textfiles4'))
#     os.makedirs(OUTPUT_DIR, exist_ok=True)
#     OUTPUT_PATH = os.path.join(OUTPUT_DIR, f'{slug}.json')
#     output = []

#     async with async_playwright() as p:
#         browser = await p.chromium.launch(headless=True)
#         context = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)...")
#         main_page = await context.new_page()

#         queries = [f"{candidate_name} {category}"]
#         urls = set()

#         for query in queries:
#             visited = set()
#             await main_page.goto(f'https://www.bing.com/search?q={query}')
#             try:
#                 await main_page.wait_for_selector('li.b_algo h2 a', timeout=8000)
#             except:
#                 content = await main_page.content()
#                 with open("bing_debug.html", "w") as f:
#                     f.write(content)
#                 if "unusual traffic" in content.lower():
#                     print("🚫 Detected bot block from Bing.")
#                 else:
#                     print("🪪 No search results found or layout changed.")
#                 return

#             print(f"🔍 Query: {query}")
#             elements = await main_page.query_selector_all('li.b_algo a') or await main_page.query_selector_all('li.b_algo h2 a')
#             print(f"🔗 Extracted top {len(elements)} result links from Bing search.")

#             for el in elements[:10]:  # top 10 only
#                 href = await el.get_attribute('href')
#                 print(f"📥 found: {href}")
#                 if href:
#                     urls.add(href)
#                 print(f"📥 Total valid URLs to visit: {len(urls)}")

#         for url in urls:
#             if url in visited:
#                 continue
#             visited.add(url)
#             print(f"🌐 Starting scrape of: {url} for {candidate_name} [{category}]")
#             links_lvl1 = await scrape_link(url, context, output, candidate_name, category)
#             print(f"🔁 Found {len(links_lvl1)} first-level links from: {url}")
#             if not all(candidate_name in link for link in links_lvl1):
#                 break

#         await browser.close()

#     with open(OUTPUT_PATH, 'w', encoding='utf-8') as out_json:
#         json.dump(output, out_json, ensure_ascii=False, indent=2)
#     print(f"💾 Saved {len(output)} chunks for {candidate_name} under {category} to {OUTPUT_PATH}")
#     print(f"✅ Done. Output for {candidate_name} saved to {OUTPUT_PATH}")

async def scrape_candidate(candidate_name, category):
    slug = candidate_name.replace(',', '').replace(' ', '_')
    OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../data/textfiles5'))
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    OUTPUT_PATH = os.path.join(OUTPUT_DIR, f'{slug}.json')
    output = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)...")
        main_page = await context.new_page()

        query = f"{candidate_name} {category}"
        visited = set()
        urls = []

        await main_page.goto(f'https://www.bing.com/search?q={query}')
        try:
            await main_page.wait_for_selector('li.b_algo h2 a', timeout=8000)
        except:
            content = await main_page.content()
            with open("bing_debug.html", "w") as f:
                f.write(content)
            if "unusual traffic" in content.lower():
                print("🚫 Detected bot block from Bing.")
            else:
                print("🪪 No search results found or layout changed.")
            return

        print(f"🔍 Query: {query}")
        elements = await main_page.query_selector_all('li.b_algo a') or await main_page.query_selector_all('li.b_algo h2 a')
        print(f"🔗 Extracted top {len(elements)} result links from Bing search.")

        for el in elements:
            if len(urls) >= (2 if category == "bio" else 10):
                break
            href = await el.get_attribute('href')
            if href and href not in visited:
                visited.add(href)
                urls.append(href)
                print(f"📥 found: {href}")

        for url in urls:
            print(f"🌐 Starting scrape of: {url} for {candidate_name} [{category}]")
            links_lvl1 = await scrape_link(url, context, output, candidate_name, category)
            if category != "bio":
                print(f"🔁 Found {len(links_lvl1)} first-level links from: {url}")
                if not all(candidate_name in link for link in links_lvl1):
                    break

        await browser.close()

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as out_json:
        json.dump(output, out_json, ensure_ascii=False, indent=2)
    print(f"💾 Saved {len(output)} chunks for {candidate_name} under {category} to {OUTPUT_PATH}")
    print(f"✅ Done. Output for {candidate_name} saved to {OUTPUT_PATH}")



if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Usage: python txtscraper2.py \"Candidate Name\" [\"Issue Category\"]")
        sys.exit(1)

    name = sys.argv[1]
    category = sys.argv[2] if len(sys.argv) > 2 else None
    print(f"📥 Starting scrape for: {name}")
    print(f"📥 Starting scrape for: {category}")

    if category:
        asyncio.run(scrape_candidate(name, category))
    else:
        for cat in list(ISSUE_KEYWORDS.keys()) + ["bio"]:
            print(f"🔎 Scraping {name} for category: {cat}")
            asyncio.run(scrape_candidate(name, cat))
