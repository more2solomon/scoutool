import { parse } from "csv-parse";
import { stringify } from "csv-stringify";
import * as cheerio from "cheerio";

// Email regex pattern
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

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

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return false;

  const [local, domain] = email.split("@");

  if (!local || local.length > 64) return false;
  if (!domain || !domain.includes(".") || domain.length > 255) return false;

  const domainParts = domain.split(".");
  if (domainParts.some(part => part.startsWith("-") || part.endsWith("-"))) return false;

  return true;
}

/**
 * Fetch and scrape a URL for emails
 */
async function scrapeUrl(url) {
  try {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      signal: AbortSignal.timeout(10000)
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
 * Parse CSV and extract URLs from the 'url', 'domain', 'store', or 'domain_url' column
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

      records.forEach((record) => {
        const urlKey = Object.keys(record).find(
          key => ["url", "domain", "store", "domain_url"].includes(key.toLowerCase())
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

    const csvText = await file.text();
    const urls = await parseCSVForUrls(csvText);

    if (urls.length === 0) {
      return Response.json(
        { ok: false, error: "No URLs found in CSV. Ensure there is a 'url', 'domain', 'store', or 'domain_url' column." },
        { status: 400 }
      );
    }

    const batchSize = 5;
    const results = [];
    let processed = 0;

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(url => scrapeUrl(url))
      );
      results.push(...batchResults);
      processed += batchResults.length;

      // Progress update
      const percent = Math.round((processed / urls.length) * 100);
      console.log(`Progress: ${percent}% (${processed}/${urls.length})`);

      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const csvOutput = await generateResultsCSV(results);

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