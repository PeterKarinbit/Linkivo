#!/usr/bin/env python3
"""
Job Scraper using JobSpy Parser CLI
Scrapes jobs from LinkedIn and Indeed using the jobsparser CLI tool
"""

import sys
import json
import argparse
import subprocess
import tempfile
import os
import pandas as pd
from datetime import datetime

def clean_value(value):
    """Clean and format values, handling NaN and None"""
    if pd.isna(value) or value is None or value == 'nan':
        return ""
    return str(value).strip()

def scrape_jobs_from_sites(search_term: str, location: str, sites: list = None, results_wanted: int = 50) -> list:
    """
    Scrape jobs from specified sites using jobsparser CLI
    
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
        
        # Create a temporary directory for output
        with tempfile.TemporaryDirectory() as temp_dir:
            # Build the jobsparser CLI command
            jobsparser_path = os.path.join(os.path.dirname(__file__), '..', 'jobsparser', 'jobsparser', 'src', 'jobsparser', 'cli.py')
            
            cmd = [
                'python3',
                jobsparser_path,
                '--search-term', search_term,
                '--location', location,
                '--results-wanted', str(results_wanted),
                '--output-dir', temp_dir,
                '--batch-size', '10',  # Smaller batch size for faster response
                '--sleep-time', '5',   # Shorter sleep time
                '--max-retries', '2',  # Fewer retries for faster response
                '--fetch-description'  # Enable fetching full descriptions for LinkedIn
            ]
            
            # Add sites
            for site in sites:
                cmd.extend(['--site', site])
            
            print(f"Running command: {' '.join(cmd)}", file=sys.stderr)
            
            # Run the jobsparser CLI
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=os.path.dirname(__file__)
            )
            
            if result.returncode != 0:
                print(f"Jobsparser CLI error: {result.stderr}", file=sys.stderr)
                return []
            
            print(f"Jobsparser CLI output: {result.stdout}", file=sys.stderr)
            
            # Find the generated CSV file
            csv_files = [f for f in os.listdir(temp_dir) if f.endswith('.csv')]
            if not csv_files:
                print("No CSV file generated", file=sys.stderr)
                return []
            
            csv_file = os.path.join(temp_dir, csv_files[0])
            print(f"Found CSV file: {csv_file}", file=sys.stderr)
            
            # Read the CSV file
            df = pd.read_csv(csv_file)
            print(f"Read {len(df)} jobs from CSV", file=sys.stderr)
            
            # Convert DataFrame to list of dictionaries
            jobs_list = []
            for _, row in df.iterrows():
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
                
                job_dict = {
                    "title": clean_value(row.get('title', '')),
                    "company": clean_value(row.get('company', '')),
                    "location": clean_value(row.get('location', '')),
                    "description": clean_value(row.get('description', '')),
                    "job_type": clean_value(row.get('job_type', '')),
                    "job_level": clean_value(row.get('job_level', '')),
                    "posted_date": clean_value(row.get('date_posted', '')),
                    "application_url": clean_value(row.get('job_url', '')),
                    "job_url_direct": clean_value(row.get('job_url_direct', '')),
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
    parser = argparse.ArgumentParser(description='Scrape jobs using jobsparser CLI')
    parser.add_argument('--search-term', required=True, help='Job search term')
    parser.add_argument('--location', required=True, help='Job location')
    parser.add_argument('--results-wanted', type=int, default=50, help='Number of results to fetch')
    parser.add_argument('--sites', nargs='+', default=['indeed', 'linkedin'], help='Sites to scrape')
    
    args = parser.parse_args()
    
    jobs = scrape_jobs_from_sites(
        search_term=args.search_term,
        location=args.location,
        sites=args.sites,
        results_wanted=args.results_wanted
    )
    
    result = {
        "success": True,
        "jobs": jobs,
        "total_count": len(jobs),
        "search_term": args.search_term,
        "location": args.location,
        "sites": args.sites,
        "scraped_at": datetime.now().isoformat()
    }
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main() 