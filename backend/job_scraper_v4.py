#!/usr/bin/env python3
"""
Job Scraper using JobSpy Library Directly
Scrapes jobs from multiple job boards using the jobspy library
"""

import sys
import json
import argparse
import os
import pandas as pd
from datetime import datetime

# Add the JobSpy directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'JobSpy'))

try:
    from jobspy import scrape_jobs
except ImportError as e:
    print(f"Error importing jobspy: {e}", file=sys.stderr)
    print("Make sure the JobSpy repository is cloned in the project root", file=sys.stderr)
    sys.exit(1)

def clean_value(value):
    """Clean and format values, handling NaN and None"""
    if pd.isna(value) or value is None or value == 'nan':
        return ""
    return str(value).strip()

def get_indeed_country(country_code):
    """Map country codes to Indeed country names"""
    country_mapping = {
        'US': 'USA',
        'KE': 'Kenya',
        'UK': 'UK',
        'CA': 'Canada',
        'AU': 'Australia',
        'DE': 'Germany',
        'FR': 'France',
        'IN': 'India',
        'BR': 'Brazil',
        'MX': 'Mexico',
        'NL': 'Netherlands',
        'SG': 'Singapore',
        'ZA': 'South Africa',
        'NG': 'Nigeria',
        'EG': 'Egypt',
        'SA': 'Saudi Arabia',
        'AE': 'United Arab Emirates',
        'PK': 'Pakistan',
        'BD': 'Bangladesh',
        'LK': 'Sri Lanka',
        'PH': 'Philippines',
        'ID': 'Indonesia',
        'MY': 'Malaysia',
        'TH': 'Thailand',
        'VN': 'Vietnam',
        'JP': 'Japan',
        'KR': 'South Korea',
        'CN': 'China',
        'HK': 'Hong Kong',
        'TW': 'Taiwan',
        'IT': 'Italy',
        'ES': 'Spain',
        'PT': 'Portugal',
        'SE': 'Sweden',
        'NO': 'Norway',
        'DK': 'Denmark',
        'FI': 'Finland',
        'CH': 'Switzerland',
        'AT': 'Austria',
        'BE': 'Belgium',
        'IE': 'Ireland',
        'PL': 'Poland',
        'CZ': 'Czech Republic',
        'HU': 'Hungary',
        'RO': 'Romania',
        'BG': 'Bulgaria',
        'HR': 'Croatia',
        'SI': 'Slovenia',
        'SK': 'Slovakia',
        'LT': 'Lithuania',
        'LV': 'Latvia',
        'EE': 'Estonia',
        'GR': 'Greece',
        'CY': 'Cyprus',
        'MT': 'Malta',
        'IS': 'Iceland',
        'LU': 'Luxembourg',
        'MC': 'Monaco',
        'LI': 'Liechtenstein',
        'AD': 'Andorra',
        'SM': 'San Marino',
        'VA': 'Holy See',
        'ALL': 'USA'  # Default to USA for global searches
    }
    return country_mapping.get(country_code.upper(), 'USA')

def scrape_jobs_from_sites(search_term: str, location: str, sites: list = None, results_wanted: int = 50, country_indeed: str = "USA") -> list:
    """
    Scrape jobs from specified sites using jobspy library directly
    
    Args:
        search_term: Job search term (e.g., "React Developer")
        location: Location for job search (e.g., "New York")
        sites: List of sites to scrape (default: ["indeed", "linkedin"])
        results_wanted: Number of results to fetch per site
        country_indeed: Country for Indeed search (default: "USA")
        
    Returns:
        List of job dictionaries
    """
    if sites is None:
        sites = ["indeed", "linkedin"]
    
    try:
        print(f"Starting job scrape for '{search_term}' in '{location}' from sites: {sites}", file=sys.stderr)
        
        # Map site names to jobspy format
        site_mapping = {
            "indeed": "indeed",
            "linkedin": "linkedin", 
            "glassdoor": "glassdoor",
            "google": "google",
            "zip_recruiter": "zip_recruiter",
            "bayt": "bayt",
            "bdjobs": "bdjobs",
            "naukri": "naukri"
        }
        
        mapped_sites = [site_mapping.get(site, site) for site in sites if site in site_mapping]
        
        if not mapped_sites:
            print("No valid sites specified", file=sys.stderr)
            return []
        
        print(f"Mapped sites: {mapped_sites}", file=sys.stderr)
        
        # Map country code to Indeed country name
        indeed_country = get_indeed_country(country_indeed)
        print(f"Using Indeed country: {indeed_country}", file=sys.stderr)
        
        # Scrape jobs using jobspy
        jobs_df = scrape_jobs(
            site_name=mapped_sites,
            search_term=search_term,
            location=location,
            results_wanted=results_wanted,
            country_indeed=indeed_country,
            linkedin_fetch_description=True,  # Get full descriptions
            verbose=1,  # Show progress
            description_format="markdown"  # Get markdown descriptions
        )
        
        print(f"Successfully scraped {len(jobs_df)} jobs", file=sys.stderr)
        
        if jobs_df.empty:
            print("No jobs found", file=sys.stderr)
            return []
        
        # Convert DataFrame to list of dictionaries
        jobs_list = []
        for _, row in jobs_df.iterrows():
            # Handle emails field - convert to list if it's a string
            emails = row.get('emails', [])
            if isinstance(emails, str):
                # Try to parse as JSON if it's a string representation
                try:
                    import ast
                    emails = ast.literal_eval(emails)
                except:
                    emails = [emails] if emails else []
            elif pd.isna(emails):
                emails = []
            
            # Clean and format salary information
            min_amount = clean_value(row.get('min_amount', ''))
            max_amount = clean_value(row.get('max_amount', ''))
            currency = clean_value(row.get('currency', ''))
            interval = clean_value(row.get('interval', ''))
            
            # Format salary display
            salary_display = ""
            if min_amount and max_amount:
                salary_display = f"{min_amount} - {max_amount} {currency}"
            elif min_amount:
                salary_display = f"{min_amount}+ {currency}"
            elif max_amount:
                salary_display = f"Up to {max_amount} {currency}"
            
            # Clean interval for display
            if interval and "CompensationInterval." in interval:
                interval = interval.replace("CompensationInterval.", "").lower()
            
            # Get job URL (prefer direct URL if available)
            job_url = clean_value(row.get('job_url', ''))
            job_url_direct = clean_value(row.get('job_url_direct', ''))
            application_url = job_url_direct if job_url_direct else job_url
            
            job_dict = {
                "title": clean_value(row.get('title', '')),
                "company": clean_value(row.get('company', '')),
                "location": clean_value(row.get('location', '')),
                "description": clean_value(row.get('description', '')),
                "job_type": clean_value(row.get('job_type', '')),
                "job_level": clean_value(row.get('job_level', '')),
                "posted_date": clean_value(row.get('date_posted', '')),
                "application_url": application_url,
                "job_url_direct": job_url_direct,
                "source": clean_value(row.get('site', '')),
                "is_remote": bool(row.get('is_remote', False)),
                "min_amount": min_amount,
                "max_amount": max_amount,
                "currency": currency,
                "interval": interval,
                "salary_display": salary_display,
                "emails": emails,
                "scraped_at": datetime.now().isoformat()
            }
            jobs_list.append(job_dict)
        
        return jobs_list
        
    except Exception as e:
        print(f"Error scraping jobs: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return []

def main():
    parser = argparse.ArgumentParser(description='Scrape jobs using jobspy library directly')
    parser.add_argument('--search-term', required=True, help='Job search term')
    parser.add_argument('--location', required=True, help='Job location')
    parser.add_argument('--results-wanted', type=int, default=50, help='Number of results to fetch')
    parser.add_argument('--sites', nargs='+', default=['indeed', 'linkedin'], help='Sites to scrape')
    parser.add_argument('--country-indeed', default='USA', help='Country for Indeed search')
    
    args = parser.parse_args()
    
    jobs = scrape_jobs_from_sites(
        search_term=args.search_term,
        location=args.location,
        sites=args.sites,
        results_wanted=args.results_wanted,
        country_indeed=args.country_indeed
    )
    
    result = {
        "success": True,
        "jobs": jobs,
        "total_count": len(jobs),
        "search_term": args.search_term,
        "location": args.location,
        "sites": args.sites,
        "country_indeed": args.country_indeed,
        "scraped_at": datetime.now().isoformat()
    }
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main() 