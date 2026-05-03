/**
 * DigestEmailTemplate
 * Renders a beautiful HTML email for the daily permit digest.
 * Uses inline CSS only (no Tailwind) for maximum email client compatibility.
 */

export interface TopLead {
  id: string;
  address: string;
  city?: string;
  state?: string;
  category?: string;
  permit_type?: string;
  estimated_value?: number;
  filed_date?: string;
  description?: string;
}

export interface DigestEmailProps {
  email: string;
  companyName?: string;
  permitCount: number;
  states: string[];
  topLeads: TopLead[];
}

function parseFirstName(email: string, companyName?: string): string {
  if (companyName) {
    const first = companyName.trim().split(/\s+/)[0];
    if (first && first.length > 1) return first;
  }
  // Parse from email: john.doe@... → John
  const localPart = email.split("@")[0];
  const namePart = localPart.split(/[._+\-]/)[0];
  if (namePart && namePart.length > 1) {
    return namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();
  }
  return "there";
}

function formatCurrency(value?: number): string {
  if (!value) return "Est. value TBD";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return "Recently";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

export function DigestEmailTemplate({
  email,
  companyName,
  permitCount,
  states,
  topLeads,
}: DigestEmailProps): string {
  const firstName = parseFirstName(email, companyName);
  const stateList = states.join(", ");
  const subject = `🔥 ${permitCount} new permits in your area today`;

  const leadCards = topLeads
    .slice(0, 3)
    .map(
      (lead) => `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:12px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:16px 20px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td>
                <p style="margin:0 0 2px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;font-weight:700;color:#111827;">
                  ${lead.address || "Address on file"}
                </p>
                <p style="margin:0 0 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#6b7280;">
                  ${[lead.city, lead.state].filter(Boolean).join(", ") || stateList}
                </p>
              </td>
              <td align="right" valign="top">
                <span style="display:inline-block;padding:3px 10px;background:#fef3c7;border:1px solid #f59e0b;border-radius:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:600;color:#92400e;">
                  🔥 Hot Lead
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-right:8px;">
                      <span style="display:inline-block;padding:3px 10px;background:#e0f2f1;border-radius:4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;font-weight:600;color:#01696F;">
                        ${lead.category || lead.permit_type || "Permit"}
                      </span>
                    </td>
                    <td style="padding-right:12px;">
                      <span style="font-family:'Courier New',monospace;font-size:15px;font-weight:700;color:#01696F;">
                        ${formatCurrency(lead.estimated_value)}
                      </span>
                    </td>
                    <td>
                      <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#9ca3af;">
                        ● ${formatTimeAgo(lead.filed_date)}
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top:14px;">
                <a href="https://permittracer.com/dashboard"
                   style="display:inline-block;padding:9px 20px;background:#01696F;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;">
                  View Lead →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
    )
    .join("");

  const noLeadsSection =
    topLeads.length === 0
      ? `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:12px;background:#f9fafb;border:1px dashed #e5e7eb;border-radius:12px;">
      <tr>
        <td style="padding:24px;text-align:center;">
          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#6b7280;">
            No top leads in the last 7 days — check back tomorrow.
          </p>
        </td>
      </tr>
    </table>
  `
      : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f4f6;min-height:100vh;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Email container -->
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

          <!-- Header / Logo -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#01696F;border-radius:16px 16px 0 0;overflow:hidden;">
                <tr>
                  <td style="padding:28px 32px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                            🏗️ Permit Tracer
                          </p>
                          <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">
                            Daily Lead Digest
                          </p>
                        </td>
                        <td align="right">
                          <span style="display:inline-block;padding:6px 14px;background:rgba(255,255,255,0.15);border-radius:20px;font-size:12px;font-weight:600;color:#ffffff;">
                            ${new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Permit count banner -->
                <tr>
                  <td style="padding:20px 32px 28px;background:rgba(0,0,0,0.1);">
                    <p style="margin:0;font-size:36px;font-weight:800;color:#ffffff;line-height:1.1;">
                      🔥 ${permitCount} new permits
                    </p>
                    <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.8);">
                      filed in ${stateList} in the last 24 hours
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body card -->
          <tr>
            <td>
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;border-radius:0 0 16px 16px;overflow:hidden;">
                <tr>
                  <td style="padding:28px 32px 24px;">

                    <!-- Greeting -->
                    <p style="margin:0 0 20px;font-size:16px;color:#374151;line-height:1.6;">
                      Hey ${firstName},
                    </p>
                    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.7;">
                      Here's your daily snapshot. You have
                      <strong style="color:#111827;">${permitCount} fresh permit${permitCount !== 1 ? "s" : ""}</strong>
                      waiting in <strong style="color:#111827;">${stateList}</strong>.
                      Below are the top 3 hottest leads by value — act fast before your competitors do.
                    </p>

                    <!-- Section header -->
                    <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;">
                      Top Leads This Week
                    </p>

                    <!-- Lead cards -->
                    ${leadCards}
                    ${noLeadsSection}

                    <!-- CTA button -->
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px;">
                      <tr>
                        <td align="center" style="padding:20px 0 8px;">
                          <a href="https://permittracer.com/dashboard"
                             style="display:inline-block;padding:14px 36px;background:#01696F;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:-0.2px;">
                            See all ${permitCount} leads →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 0;">
                      <tr>
                        <td style="border-top:1px solid #f3f4f6;padding-top:20px;">

                          <!-- Tips row -->
                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td width="48%" style="background:#f9fafb;border-radius:10px;padding:14px 16px;">
                                <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#111827;">📞 Pro Tip</p>
                                <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.5;">
                                  Call within 24 hours of permit filing — response rates drop 80% after day 3.
                                </p>
                              </td>
                              <td width="4%"></td>
                              <td width="48%" style="background:#f9fafb;border-radius:10px;padding:14px 16px;">
                                <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#111827;">🎯 Did you know?</p>
                                <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.5;">
                                  Contractors who call within 1 hour close 7x more deals than those who wait.
                                </p>
                              </td>
                            </tr>
                          </table>

                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 16px 8px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">
                You're receiving this because you signed up for Permit Tracer daily digests.
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                <a href="https://permittracer.com/settings" style="color:#01696F;text-decoration:none;">Manage preferences</a>
                &nbsp;·&nbsp;
                <a href="https://permittracer.com/unsubscribe?email=${encodeURIComponent(email)}" style="color:#9ca3af;text-decoration:none;">Unsubscribe</a>
                &nbsp;·&nbsp;
                <a href="https://permittracer.com" style="color:#9ca3af;text-decoration:none;">permittracer.com</a>
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#d1d5db;">
                Permit Tracer · Built for contractors who knock doors
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return html;
}

export function getDigestSubject(permitCount: number): string {
  return `🔥 ${permitCount} new permits in your area today`;
}
