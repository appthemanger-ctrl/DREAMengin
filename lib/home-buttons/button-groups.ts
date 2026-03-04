// Proper Button List (NO utility buttons)

export const BUTTON_GROUPS = {
  auth: [
    { label: "Sign In",           href: "/signin" },
    { label: "Create Account",    href: "/signup" },
    { label: "Forgot Password",   href: "/forgot-password" },
    { label: "Reset Password",    href: "/reset-password" },
    { label: "Verify Email",      href: "/verify-email" },
    { label: "Sign Out",          href: "/logout" },
  ],

  account: [
    { label: "Profile",             href: "/account/profile" },
    { label: "Account Settings",    href: "/account/settings" },
    { label: "Security",            href: "/account/security" },
    { label: "Billing",             href: "/account/billing" },
    { label: "Subscriptions",       href: "/account/subscriptions" },
    { label: "Payment Methods",     href: "/account/payments" },
    { label: "Connected Accounts",  href: "/account/connections" },
    { label: "Delete Account",      href: "/account/delete" },
  ],

  securityPrivacy: [
    { label: "Privacy Policy",           href: "/privacy" },
    { label: "Terms of Service",         href: "/terms" },
    { label: "Cookie Preferences",       href: "/cookies" },
    { label: "Two-Factor Authentication",href: "/account/2fa" },
    { label: "Active Sessions",          href: "/account/sessions" },
    { label: "Download My Data",         href: "/account/data-export" },
    { label: "Data Deletion Request",    href: "/account/data-delete" },
  ],

  support: [
    { label: "Help Center",       href: "/help" },
    { label: "Contact Support",   href: "/support/contact" },
    { label: "Submit a Ticket",   href: "/support/ticket" },
    { label: "Report a Bug",      href: "/support/bug" },
    { label: "Feature Request",   href: "/support/feature" },
    { label: "System Status",     href: "/status" },
    { label: "Community Forum",   href: "/community" },
    { label: "FAQ",               href: "/faq" },
  ],

  product: [
    { label: "Dashboard",     href: "/dashboard" },
    { label: "My Projects",   href: "/projects" },
    { label: "My Dreams",     href: "/dreams" },
    { label: "Create New",    href: "/create" },
    { label: "Templates",     href: "/templates" },
    { label: "Integrations",  href: "/integrations" },
    { label: "Notifications", href: "/notifications" },
    { label: "Changelog",     href: "/updates" },
  ],

  developer: [
    { label: "Admin Panel",     href: "/admin" },
    { label: "Developer Tools", href: "/developer" },
    { label: "API Keys",        href: "/developer/api-keys" },
    { label: "Webhooks",        href: "/developer/webhooks" },
    { label: "Logs",            href: "/developer/logs" },
    { label: "Usage & Limits",  href: "/developer/usage" },
    { label: "Sandbox",         href: "/developer/sandbox" },
    { label: "Diagnostics",     href: "/developer/diagnostics" },
  ],

  company: [
    { label: "About",       href: "/about" },
    { label: "Blog",        href: "/blog" },
    { label: "Careers",     href: "/careers" },
    { label: "Press Kit",   href: "/press" },
    { label: "Partners",    href: "/partners" },
    { label: "Affiliates",  href: "/affiliates" },
    { label: "Newsletter",  href: "/newsletter" },
    { label: "Social Media",href: "/social" },
  ],

  legal: [
    { label: "Legal",                 href: "/legal" },
    { label: "Compliance",            href: "/compliance" },
    { label: "Accessibility",         href: "/accessibility" },
    { label: "Disclaimer",            href: "/disclaimer" },
    { label: "Licensing",             href: "/licensing" },
    { label: "Acceptable Use Policy", href: "/acceptable-use" },
  ],
} as const;

export type ButtonGroupName = keyof typeof BUTTON_GROUPS;
export type ButtonItem = (typeof BUTTON_GROUPS)[ButtonGroupName][number];
