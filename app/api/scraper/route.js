import { parse } from "csv-parse";
import { stringify } from "csv-stringify";
import * as cheerio from "cheerio";

// Email regex pattern
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Common email-related keywords to help identify emails in text
const EMAIL_KEYWORDS = ["email", "mail", "contact", "reach", "mailto"];

/**
 * Extract emails from HTML content
 */
function extractEmailsFromHTML(html) {
  const $ = cheerio.load(html);
  const emails = new Set();

  // Extract from mailto links
  $("a[href^='mailto:']").each((_, elem) => {
    const href = $(elem).attr("href");
    const email = href.replace("mailto:", "").split("?")[0].trim();
    if (EMAIL_REGEX.test(email)) {
      emails.add(email.toLowerCase());
    }
  });

  // Extract from text content
  const text = $.text();
  const matches = text.match(EMAIL_REGEX);
  if (matches) {
    matches.forEach((email) => {
      // Basic validation: must have @ and domain
      if (email.includes("@") && email.split("@")[1].includes(".")) {
        emails.add(email.toLowerCase());
      }
    });
  }

  return Array.from(emails);
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  
  // Basic format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return false;

  // Additional checks
  const [local, domain] = email.split("@");
  
  // Local part shouldn't be empty or too long
  if (!local || local.length > 64) return false;
  
  // Domain should have at least one dot and valid TLD
  if (!domain || !domain.includes(".") || domain.length > 255) return false;
  
  // Domain parts shouldn't start or end with hyphen
  const domainParts = domain.split(".");
  if (domainParts.some(part => part.startsWith("-") || part.endsWith("-"))) return false;
  
  return true;
}

/**
 * Fetch and scrape a URL for emails
 */
async function scrapeUrl(url) {
  try {
    // Ensure URL has protocol
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      return {
        url,
        success: false,
        error: `HTTP ${response.status}`,
        emails: []
      };
    }

    const html = await response.text();
    const emails = extractEmailsFromHTML(html);
    const validEmails = emails.filter(isValidEmail);

    return {
      url,
      success: true,
      emails: validEmails,
      emailCount: validEmails.length
    };
  } catch (error) {
    return {
      url,
      success: false,
      error: error.message,
      emails: []
    };
  }
}

/**
 * Parse CSV and extract URLs from the 'url', 'domain', or 'store' column
 */
function parseCSVForUrls(csvText) {
  return new Promise((resolve, reject) => {
    const urls = [];
    
    parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }, (err, records) => {
      if (err) {
        reject(err);
        return;
      }

      // Look for URL column (case-insensitive)
      records.forEach((record) => {
        const urlKey = Object.keys(record).find(
          key => ["url", "domain", "store"].includes(key.toLowerCase())
        );
        
        if (urlKey && record[urlKey]) {
          urls.push(record[urlKey].trim());
        }
      });

      resolve(urls);
    });
  });
}

/**
 * Generate CSV from results
 */
function generateResultsCSV(results) {
  return new Promise((resolve, reject) => {
    const rows = results.flatMap(result => {
      if (result.emails.length === 0) {
        return [{
          url: result.url,
          status: result.success ? "No emails found" : result.error,
          email: "",
          domain: ""
        }];
      }
      
      return result.emails.map(email => ({
        url: result.url,
        status: "Success",
        email: email,
        domain: email.split("@")[1]
      }));
    });

    stringify(rows, {
      header: true,
      columns: ["url", "status", "email", "domain"]
    }, (err, output) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(output);
    });
  });
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return Response.json(
        { ok: false, error: "No CSV file provided" },
        { status: 400 }
      );
    }

    // Read file content
    const csvText = await file.text();

    // Parse CSV for URLs
    const urls = await parseCSVForUrls(csvText);

    if (urls.length === 0) {
      return Response.json(
        { ok: false, error: "No URLs found in CSV. Ensure there is a 'url', 'domain', or 'store' column." },
        { status: 400 }
      );
    }

    // Scrape URLs in batches to avoid overwhelming servers
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(url => scrapeUrl(url))
      );
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Generate CSV output
    const csvOutput = await generateResultsCSV(results);

    // Calculate stats
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalEmails = results.reduce((sum, r) => sum + r.emails.length, 0);
    const uniqueEmails = new Set(
      results.flatMap(r => r.emails)
    ).size;

    return Response.json({
      ok: true,
      stats: {
        totalUrls: urls.length,
        successful,
        failed,
        totalEmails,
        uniqueEmails
      },
      results,
      csv: csvOutput
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
