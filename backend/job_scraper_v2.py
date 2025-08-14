#!/usr/bin/env python3
"""
Job Scraper using JobSpy
Scrapes jobs from LinkedIn and Indeed based on search criteria
"""

import sys
import json
import argparse
from datetime import datetime, date
import os

# Add the JobSpy directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'JobSpy'))

try:
    from jobspy import scrape_jobs
except ImportError as e:
    print(f"Error importing jobspy: {e}", file=sys.stderr)
    print("Make sure the JobSpy repository is cloned in the project root", file=sys.stderr)
    sys.exit(1)

def serialize_value(value):
    """Helper function to serialize values for JSON output"""
    if isinstance(value, date):
        return value.isoformat()
    elif isinstance(value, datetime):
        return value.isoformat()
    elif value is None:
        return ""
    elif isinstance(value, float) and value != value:  # Check for NaN
        return None
    else:
        return str(value)

def scrape_jobs_from_sites(search_term: str, location: str, sites: list = None, results_wanted: int = 50) -> list:
    """
    Scrape jobs from specified sites using JobSpy
    
    Args:
        search_term: Job search term (e.g., "React Developer")
        location: Location for job search (e.g., "New York")
        sites: List of sites to scrape (default: ["indeed", "linkedin"])
        results_wanted: Number of results to fetch per site
        
    Returns:
        List of job dictionaries
    """
    if sites is None:
        sites = ["indeed", "linkedin"]
    
    try:
        print(f"Starting job scrape for '{search_term}' in '{location}' from sites: {sites}", file=sys.stderr)
        
        # Scrape jobs using JobSpy
        jobs_df = scrape_jobs(
            site_name=sites,
            search_term=search_term,
            location=location,
            results_wanted=results_wanted,
            country_indeed="USA",
            verbose=0  # Reduce verbosity
        )
        
        print(f"Successfully scraped {len(jobs_df)} jobs", file=sys.stderr)
        
        # Convert DataFrame to list of dictionaries
        jobs_list = []
        for _, row in jobs_df.iterrows():
            emails = row.get('emails', [])
            # Fix: ensure emails is always a list, never NaN or None
            if emails is None or (isinstance(emails, float) and emails != emails):  # NaN check
                emails = []
            job_dict = {
                "title": serialize_value(row.get('title', '')),
                "company": serialize_value(row.get('company', '')),
                "location": serialize_value(row.get('location', '')),
                "description": serialize_value(row.get('description', '')),
                "job_type": serialize_value(row.get('job_type', '')),
                "job_level": serialize_value(row.get('job_level', '')),
                "posted_date": serialize_value(row.get('date_posted', '')),
                "application_url": serialize_value(row.get('job_url', '')),
                "job_url_direct": serialize_value(row.get('job_url_direct', '')),
                "source": serialize_value(row.get('site', '')),
                "is_remote": bool(row.get('is_remote', False)),
                "min_amount": serialize_value(row.get('min_amount', '')),
                "max_amount": serialize_value(row.get('max_amount', '')),
                "currency": serialize_value(row.get('currency', '')),
                "interval": serialize_value(row.get('interval', '')),
                "emails": emails,
                "scraped_at": datetime.now().isoformat()
            }
            jobs_list.append(job_dict)
        
        return jobs_list
        
    except Exception as e:
        print(f"Error scraping jobs: {str(e)}", file=sys.stderr)
        return []

def main():
    """Main function to handle command line arguments and execute scraping"""
    parser = argparse.ArgumentParser(description="Scrape jobs using JobSpy")
    parser.add_argument("--search-term", required=True, help="Job search term")
    parser.add_argument("--location", required=True, help="Location for job search")
    parser.add_argument("--sites", nargs="+", default=["indeed", "linkedin"], 
                       help="Sites to scrape (default: indeed linkedin)")
    parser.add_argument("--results-wanted", type=int, default=50, 
                       help="Number of results to fetch per site (default: 50)")
    parser.add_argument("--output-file", help="Output file for results (optional)")
    
    args = parser.parse_args()
    
    # Scrape jobs
    jobs = scrape_jobs_from_sites(
        search_term=args.search_term,
        location=args.location,
        sites=args.sites,
        results_wanted=args.results_wanted
    )
    
    # Prepare response
    response = {
        "success": True,
        "jobs": jobs,
        "total_count": len(jobs),
        "sources": args.sites,
        "search_term": args.search_term,
        "location": args.location,
        "scraped_at": datetime.now().isoformat()
    }
    
    # Output results
    if args.output_file:
        with open(args.output_file, 'w', encoding='utf-8') as f:
            json.dump(response, f, indent=2, ensure_ascii=False)
        print(f"Results saved to {args.output_file}")
    else:
        # Output to stdout for backend
        print(json.dumps(response, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main() 