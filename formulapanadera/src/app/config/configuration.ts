// Available languages
export const LANGUAGE = {
  default: "es",
  available: [
    { name: "Español", code: "es" },
    { name: "English", code: "en" },
  ],
};

export const APP_NAME = "Haz pan en casa";

// Base url for getting content
export const BASE_WEB_NEWS = 'https://synergy.vision/';

// Report to email
export const REPORT_TO = 'contacto@synergy.vision';

// iOS makert url
export const IOS_MARKET = 'ios market url';
export const IOS_APP_ID = 'ios app id';
// Android market url
export const ANDROID_MARKET = 'market://details?id=<package_name>';

// Help center
export const HELP_CENTER = {
  wa: "https://wa.me/+584142769752",
  telegram: "https://t.me/bysynergyvision"
}

// Currency
export const CURRENCY = "$";

// Number of loading items on listing pages
export const LOADING_ITEMS = 10;


// Page URLs
export const APP_URL = {
  auth: {
    name: "auth",
    routes: {
      sign_up: "sign-up",
      sign_in: "sign-in",
      forgot_password: "forgot-password",
    },
  },
  menu: {
    name: "menu",
    routes: {
      production: {
        main: "production",
        routes: {
          listing: "",
          details: "details",
          management: "manage",
          start: "start",
        },
      },
      formula: {
        main: "formula",
        routes: {
          listing: "",
          details: "details",
          management: "manage",
        },
      },
      ingredient: {
        main: "ingredient",
        routes: {
          listing: "",
          details: "details",
          management: "manage",
        },
      },
      settings: {
        main: "settings",
        routes: {
          settings: "",
          change_password: "change-password",
          user_groups: {
            main: "user-groups",
            routes: {
              listing: "",
              management: "manage",
            },
          },
          shared: {
            main: "shared",
            routes: {
              listing: "",
            },
          },
          how_to_use: "how-to-use",
          tutorials: "tutorials",
          contact: "contact",
          social_media: "social-media",
          faq: "faq",
          flashcards: "flashcards",
          push_messages: "pushMessages"
        },
      },
    },
  },
};

// Main page
export const MAIN_PAGE =
  "/" + APP_URL.menu.name + "/" + APP_URL.menu.routes.production.main;
