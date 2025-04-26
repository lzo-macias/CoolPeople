

# import os
# import re
# import asyncio
# from urllib.parse import urlparse, urljoin
# import sys

# from bs4 import BeautifulSoup
# import requests
# from playwright.async_api import async_playwright
# import random


# # OUTPUT_PATH = f'data/stanceData/{candidate_slug}.txt'
# KEYWORDS = ['issue', 'platform', 'vision', 'priorities', 'agenda', 'legislation', 'bill', 'leg']
# EXCLUDED_DOMAIN = 'nyccfb'
# PARKED_KEYWORDS = ['buy this domain', 'this domain is for sale', 'site not found', '404', 'domain parking']

# visited = set()

# # def is_valid_first_level(url, candidate_name):
# #     try:
# #         parsed = urlparse(url)
# #         domain = parsed.hostname.lower() if parsed.hostname else ''
# #         if EXCLUDED_DOMAIN in domain:
# #             return False
# #         if domain.endswith('.gov'):
# #             return True
# #         name_parts = re.findall(r'\w+', candidate_name.lower())
# #         return any(part in domain for part in name_parts)
# #     except Exception:
# #         return False

# def is_valid_first_level(url, candidate_name):
#     try:
#         parsed = urlparse(url)
#         domain = parsed.hostname.lower() if parsed.hostname else ''
#         if EXCLUDED_DOMAIN in domain:
#             return False
#         if domain.endswith('.gov'):
#             return True
#         name_parts = re.findall(r'\w+', candidate_name.lower())
#         # Check if any part of the candidate's name is in the domain
#         return any(part in domain for part in name_parts)
#     except Exception:
#         return False

# def is_internal_or_gov(link, base_url):
#     try:
#         link_host = urlparse(link).hostname
#         base_host = urlparse(base_url).hostname
#         return (link_host == base_host) or (link_host and link_host.endswith('.gov') and EXCLUDED_DOMAIN not in link_host)
#     except Exception:
#         return False

# # Legacy method using requests — commented out
# # def extract_text_and_links(url):
# #     try:
# #         res = requests.get(url, timeout=10)
# #         if 'text/html' not in res.headers.get('Content-Type', ''):
# #             return '', []
# #         soup = BeautifulSoup(res.text, 'html.parser')
# #         text = ' '.join(el.get_text(separator=' ', strip=True) for el in soup.select('p, h1, h2, h3, h4, h5, h6, li, td, span, article'))
# #         if any(kw in text.lower() for kw in PARKED_KEYWORDS):
# #             return '', []
# #         base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
# #         links = [urljoin(base_url, a.get('href')) for a in soup.find_all('a', href=True)]
# #         links = [link for link in links if link.startswith('http')]
# #         return text.strip(), list(set(links))
# #     except Exception:
# #         return '', []

# # async def extract_text_and_links(url):
# #     headers = {
# #         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
# #     }
# #     try:
# #         res = requests.get(url, headers=headers, timeout=10)
# #         if res.status_code == 403:
# #             print(f"❌ 403 Forbidden from requests: {url}")
# #             return await extract_with_playwright(url)
# #         if 'text/html' not in res.headers.get('Content-Type', ''):
# #             return '', []
# #         soup = BeautifulSoup(res.text, 'html.parser')
# #     except Exception as e:
# #         print(f"⚠️ Requests failed for {url}: {e}")
# #         return await extract_with_playwright(url)

# #     return parse_html_and_links(soup, url)

# async def extract_text_and_links(url, page):
#     headers = {
#         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...'
#     }
#     try:
#         res = requests.get(url, headers=headers, timeout=10)
#         if res.status_code == 403:
#             print(f"❌ 403 Forbidden from requests: {url}")
#             return await extract_with_playwright(url, page)
#         if 'text/html' not in res.headers.get('Content-Type', ''):
#             return '', []
#         soup = BeautifulSoup(res.text, 'html.parser')
#     except Exception as e:
#         print(f"⚠️ Requests failed for {url}: {e}")
#         return await extract_with_playwright(url, page)

#     return parse_html_and_links(soup, url)


# # async def extract_with_playwright(url):
# #     try:
# #         async with async_playwright() as p:
# #             browser = await p.chromium.launch(headless=True)
# #             page = await browser.new_page()
# #             await page.goto(url, timeout=10000)
# #             content = await page.content()
# #             await browser.close()
# #         soup = BeautifulSoup(content, 'html.parser')
# #         return parse_html_and_links(soup, url)
# #     except Exception as e:
# #         print(f"❌ Playwright failed for {url}: {e}")
# #         return '', []

# async def extract_with_playwright(url, page):
#     try:
#         await page.goto(url, timeout=10000)
#         content = await page.content()
#         soup = BeautifulSoup(content, 'html.parser')
#         return parse_html_and_links(soup, url)
#     except Exception as e:
#         print(f"❌ Playwright failed for {url}: {e}")
#         return '', []

# def parse_html_and_links(soup, url):
#     text = ' '.join(el.get_text(separator=' ', strip=True) for el in soup.select('p, h1, h2, h3, h4, h5, h6, li, td, span, article'))
#     if any(kw in text.lower() for kw in PARKED_KEYWORDS):
#         return '', []
#     base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
#     links = [urljoin(base_url, a.get('href')) for a in soup.find_all('a', href=True)]
#     links = [link for link in links if link.startswith('http')]
#     return text.strip(), list(set(links))

# # async def search_bing(candidate_name):
# #     async with async_playwright() as p:
# #         browser = await p.chromium.launch()
# #         page = await browser.new_page()
# #         await page.goto(f'https://www.bing.com/search?q={candidate_name}')
# #         await page.wait_for_timeout(2000)
# #         elements = await page.query_selector_all('li.b_algo a')
# #         urls = []
# #         for el in elements:
# #             href = await el.get_attribute('href')
# #             if href and href.startswith('http'):
# #                 urls.append(href)
# #         await browser.close()
# #         return list(set(urls))

# async def search_bing(candidate_name, page):
#     await page.goto(f'https://www.bing.com/search?q={candidate_name}')
#     await page.wait_for_timeout(2000)
#     elements = await page.query_selector_all('li.b_algo a')
#     urls = []
#     for el in elements:
#         href = await el.get_attribute('href')
#         if href and href.startswith('http'):
#             urls.append(href)
#     return list(set(urls))


# # async def scrape_candidate(candidate_name):
# #     candidate_slug = candidate_name.replace(' ', '_')
# #     OUTPUT_PATH = f'data/stanceData3/{candidate_slug}.txt'
# #     os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
# #     urls = await search_bing(candidate_name)
# #     filtered = [u for u in urls if is_valid_first_level(u, candidate_name)]

# #     with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
# #         for url in filtered:
# #             if url in visited:
# #                 continue
# #             visited.add(url)
# #             f.write(f'\n--- Landing Page: {url} ---\n')
# #             print(f'🟢 Scraping landing: {url}')
# #             text, links_lvl1 = await extract_text_and_links(url)
# #             f.write(text + '\n')

# #             for link1 in links_lvl1:
# #                 if (
# #                     link1 in visited or 
# #                     not any(k in link1.lower() for k in KEYWORDS) or 
# #                     not is_internal_or_gov(link1, url)
# #                 ):
# #                     continue
# #                 visited.add(link1)
# #                 f.write(f'\n--- 2nd Level Page: {link1} ---\n')
# #                 print(f'🔵 Scraping 2nd level: {link1}')
# #                 text2, links_lvl2 = await extract_text_and_links(link1)
# #                 f.write(text2 + '\n')

# #                 for link2 in links_lvl2:
# #                     if link2 in visited or not is_internal_or_gov(link2, link1):
# #                         continue
# #                     visited.add(link2)
# #                     f.write(f'\n--- 3rd Level Page: {link2} ---\n')
# #                     print(f'🟣 Scraping 3rd level: {link2}')
# #                     text3, _ = await extract_text_and_links(link2)
# #                     f.write(text3 + '\n')

# async def scrape_candidate(candidate_name):
#     candidate_slug = candidate_name.replace(' ', '_')
#     OUTPUT_PATH = f'data/stanceData3/{candidate_slug}.txt'
#     os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

#     async with async_playwright() as p:
#         browser = await p.chromium.launch(headless=True)
#         context = await browser.new_context()
#         page = await context.new_page()

#         urls = await search_bing(candidate_name, page)
#         filtered = [u for u in urls if is_valid_first_level(u, candidate_name)]

#         with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
#             for url in filtered:
#                 if url in visited:
#                     continue
#                 visited.add(url)
#                 f.write(f'\n--- Landing Page: {url} ---\n')
#                 print(f'🟢 Scraping landing: {url}')
#                 text, links_lvl1 = await extract_text_and_links(url, page)
#                 f.write(text + '\n')
#                 await asyncio.sleep(random.uniform(1.5, 3.5))  # <-- sleep after landing page

#                 for link1 in links_lvl1:
#                     if (
#                         link1 in visited or 
#                         not any(k in link1.lower() for k in KEYWORDS) or 
#                         not is_internal_or_gov(link1, url)
#                     ):
#                         continue
#                     visited.add(link1)
#                     f.write(f'\n--- 2nd Level Page: {link1} ---\n')
#                     print(f'🔵 Scraping 2nd level: {link1}')
#                     text2, links_lvl2 = await extract_text_and_links(link1, page)
#                     f.write(text2 + '\n')
#                     await asyncio.sleep(random.uniform(1.5, 3.5))  # <-- sleep after 2nd level

#                     for link2 in links_lvl2:
#                         if link2 in visited or not is_internal_or_gov(link2, link1):
#                             continue
#                         visited.add(link2)
#                         f.write(f'\n--- 3rd Level Page: {link2} ---\n')
#                         print(f'🟣 Scraping 3rd level: {link2}')
#                         text3, _ = await extract_text_and_links(link2, page)
#                         f.write(text3 + '\n')
#                         await asyncio.sleep(random.uniform(1.5, 3.5))  # <-- sleep after 3rd level

#         await browser.close()


# if __name__ == "__main__":
#     if len(sys.argv) < 2:
#         print("Usage: python3 pythonscraper.py 'Candidate Name'")
#     else:
#         candidate = sys.argv[1]
#         try:
#             asyncio.run(asyncio.wait_for(scrape_candidate(candidate), timeout=300))
#         except asyncio.TimeoutError:
#             print(f"⏱️ Timeout occurred while processing {candidate}. Skipping.")

import os
import re
import asyncio
from urllib.parse import urlparse, urljoin
import sys

from bs4 import BeautifulSoup
import requests
from playwright.async_api import async_playwright
import random

KEYWORDS = ['issue', 'platform', 'vision', 'priorities', 'agenda', 'legislation', 'bill', 'leg']
EXCLUDED_DOMAIN = 'nyccfb'
PARKED_KEYWORDS = ['buy this domain', 'this domain is for sale', 'site not found', '404', 'domain parking']

visited = set()

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

def is_internal_or_gov(link, base_url):
    try:
        link_host = urlparse(link).hostname
        base_host = urlparse(base_url).hostname
        return (link_host == base_host) or (link_host and link_host.endswith('.gov') and EXCLUDED_DOMAIN not in link_host)
    except Exception:
        return False

async def extract_text_and_links(url, page):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...'
    }
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 403:
            print(f"❌ 403 Forbidden from requests: {url}")
            return await extract_with_playwright(url, page)
        if 'text/html' not in res.headers.get('Content-Type', ''):
            return '', []
        soup = BeautifulSoup(res.text, 'html.parser')
    except Exception as e:
        print(f"⚠️ Requests failed for {url}: {e}")
        return await extract_with_playwright(url, page)

    return parse_html_and_links(soup, url)

async def extract_with_playwright(url, page):
    try:
        await page.goto(url, timeout=15000)
        content = await page.content()
        soup = BeautifulSoup(content, 'html.parser')
        return parse_html_and_links(soup, url)
    except Exception as e:
        print(f"❌ Playwright failed for {url}: {e}")
        return '', []

def parse_html_and_links(soup, url):
    text = ' '.join(el.get_text(separator=' ', strip=True) for el in soup.select('p, h1, h2, h3, h4, h5, h6, li, td, span, article'))
    if any(kw in text.lower() for kw in PARKED_KEYWORDS):
        return '', []
    base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
    links = [urljoin(base_url, a.get('href')) for a in soup.find_all('a', href=True)]
    links = [link for link in links if link.startswith('http')]
    return text.strip(), list(set(links))

async def search_bing(candidate_name, page):
    await page.goto(f'https://www.bing.com/search?q={candidate_name}')
    await page.wait_for_timeout(2000)
    elements = await page.query_selector_all('li.b_algo a')
    urls = []
    for el in elements:
        href = await el.get_attribute('href')
        if href and href.startswith('http'):
            urls.append(href)
    return list(set(urls))

async def scrape_link(url, context, writer, level):
    try:
        page = await context.new_page()
        text, links = await extract_text_and_links(url, page)
        await page.close()

        writer.write(f'\n--- {level} Level Page: {url} ---\n')
        writer.write(text + '\n')
        await asyncio.sleep(random.uniform(1.2, 3.0))  # Light delay between pages
        return links
    except Exception as e:
        print(f"⚠️ Error scraping {url}: {e}")
        return []

async def scrape_candidate(candidate_name):
    candidate_slug = candidate_name.replace(' ', '_')
    OUTPUT_PATH = f'data/stanceData3/{candidate_slug}.txt'
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        main_page = await context.new_page()

        urls = await search_bing(candidate_name, main_page)
        filtered = [u for u in urls if is_valid_first_level(u, candidate_name)]

        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            for url in filtered:
                if url in visited:
                    continue
                visited.add(url)

                print(f'🟢 Scraping landing: {url}')
                links_lvl1 = await scrape_link(url, context, f, 'Landing')

                scrape_tasks_lvl1 = []
                for link1 in links_lvl1:
                    if link1 in visited or not any(k in link1.lower() for k in KEYWORDS) or not is_internal_or_gov(link1, url):
                        continue
                    visited.add(link1)
                    scrape_tasks_lvl1.append(scrape_link(link1, context, f, '2nd'))

                second_level_links = await asyncio.gather(*scrape_tasks_lvl1)

                scrape_tasks_lvl2 = []
                for links_set in second_level_links:
                    for link2 in links_set:
                        if link2 in visited or not is_internal_or_gov(link2, link2):
                            continue
                        visited.add(link2)
                        scrape_tasks_lvl2.append(scrape_link(link2, context, f, '3rd'))

                await asyncio.gather(*scrape_tasks_lvl2)

        await browser.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 pythonscraper.py 'Candidate Name'")
    else:
        candidate = sys.argv[1]
        try:
            asyncio.run(asyncio.wait_for(scrape_candidate(candidate), timeout=300))
        except asyncio.TimeoutError:
            print(f"⏱️ Timeout occurred while processing {candidate}. Skipping.")
