/**
 * Analytics tracking for email campaigns
 * Tracks sends, opens, clicks, bounces, and replies
 * Data is stored in-memory for the current session only
 */

class AnalyticsTracker {
  constructor() {
    this.events = [];
    this.sessionStart = Date.now();
  }

  track(event) {
    const entry = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...event
    };
    this.events.push(entry);
    console.log(`[Analytics] ${entry.type}:`, entry);
    return entry;
  }

  emailSent(to, subject, recordId = null) {
    return this.track({
      type: "email_sent",
      to,
      subject,
      recordId
    });
  }

  emailOpened(email, messageId = null) {
    return this.track({
      type: "email_opened",
      email,
      messageId
    });
  }

  emailClicked(email, link, messageId = null) {
    return this.track({
      type: "email_clicked",
      email,
      link,
      messageId
    });
  }

  emailBounced(email, reason, messageId = null) {
    return this.track({
      type: "email_bounced",
      email,
      reason,
      messageId
    });
  }

  emailReplied(email, messageId = null) {
    return this.track({
      type: "email_replied",
      email,
      messageId
    });
  }

  emailFailed(email, error, messageId = null) {
    return this.track({
      type: "email_failed",
      email,
      error,
      messageId
    });
  }

  getStats() {
    const now = Date.now();
    const sessionDuration = now - this.sessionStart;

    const sends = this.events.filter(e => e.type === "email_sent");
    const opens = this.events.filter(e => e.type === "email_opened");
    const clicks = this.events.filter(e => e.type === "email_clicked");
    const bounces = this.events.filter(e => e.type === "email_bounced");
    const replies = this.events.filter(e => e.type === "email_replied");
    const failed = this.events.filter(e => e.type === "email_failed");

    const uniqueEmailsSent = new Set(sends.map(e => e.to)).size;
    const uniqueOpens = new Set(opens.map(e => e.email)).size;
    const uniqueClicks = new Set(clicks.map(e => e.email)).size;
    const uniqueBounces = new Set(bounces.map(e => e.email)).size;
    const uniqueReplies = new Set(replies.map(e => e.email)).size;

    const openRate = uniqueEmailsSent > 0 ? (uniqueOpens / uniqueEmailsSent * 100).toFixed(2) : 0;
    const clickRate = uniqueEmailsSent > 0 ? (uniqueClicks / uniqueEmailsSent * 100).toFixed(2) : 0;
    const bounceRate = uniqueEmailsSent > 0 ? (uniqueBounces / uniqueEmailsSent * 100).toFixed(2) : 0;
    const replyRate = uniqueEmailsSent > 0 ? (uniqueReplies / uniqueEmailsSent * 100).toFixed(2) : 0;
    const successRate = uniqueEmailsSent > 0 ? ((uniqueEmailsSent - failed.length) / uniqueEmailsSent * 100).toFixed(2) : 0;

    return {
      sessionStart: new Date(this.sessionStart).toISOString(),
      sessionDuration,
      totalEvents: this.events.length,
      summary: {
        sent: sends.length,
        uniqueSent: uniqueEmailsSent,
        delivered: sends.length - failed.length,
        opened: opens.length,
        uniqueOpened: uniqueOpens,
        openRate: parseFloat(openRate),
        clicked: clicks.length,
        uniqueClicked: uniqueClicks,
        clickRate: parseFloat(clickRate),
        bounced: bounces.length,
        uniqueBounced: uniqueBounces,
        bounceRate: parseFloat(bounceRate),
        replied: replies.length,
        uniqueReplied: uniqueReplies,
        replyRate: parseFloat(replyRate),
        failed: failed.length,
        successRate: parseFloat(successRate)
      },
      timeline: this.events.slice(-100).reverse()
    };
  }

  reset() {
    this.events = [];
    this.sessionStart = Date.now();
  }
}

// Singleton instance
const analytics = new AnalyticsTracker();

export default analytics;

export function getAnalytics() {
  return analytics.getStats();
}

export function trackSend(to, subject, recordId) {
  return analytics.emailSent(to, subject, recordId);
}

export function trackOpen(email, messageId) {
  return analytics.emailOpened(email, messageId);
}

export function trackClick(email, link, messageId) {
  return analytics.emailClicked(email, link, messageId);
}

export function trackBounce(email, reason, messageId) {
  return analytics.emailBounced(email, reason, messageId);
}

export function trackReply(email, messageId) {
  return analytics.emailReplied(email, messageId);
}

export function trackFail(email, error, messageId) {
  return analytics.emailFailed(email, error, messageId);
}