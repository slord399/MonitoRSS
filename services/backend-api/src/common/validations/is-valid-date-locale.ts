import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import advancedFormat from "dayjs/plugin/advancedFormat";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

const SUPPORTED_LOCALES = [
  "af",
  "am",
  "ar-dz",
  "ar-iq",
  "ar-kw",
  "ar-ly",
  "ar-ma",
  "ar-sa",
  "ar-tn",
  "ar",
  "az",
  "be",
  "bg",
  "bi",
  "bm",
  "bn-bd",
  "bn",
  "bo",
  "br",
  "bs",
  "ca",
  "cs",
  "cv",
  "cy",
  "da",
  "de-at",
  "de-ch",
  "de",
  "dv",
  "el",
  "en-au",
  "en-ca",
  "en-gb",
  "en-ie",
  "en-il",
  "en-in",
  "en-nz",
  "en-sg",
  "en-tt",
  "en",
  "eo",
  "es-do",
  "es",
  "et",
  "eu",
  "fa",
  "fi",
  "fo",
  "fr-ca",
  "fr-ch",
  "fr",
  "fy",
  "ga",
  "gd",
  "gl",
  "gom-latn",
  "gu",
  "he",
  "hi",
  "hr",
  "ht",
  "hu",
  "hy-am",
  "id",
  "is",
  "it-ch",
  "it",
  "ja",
  "jv",
  "ka",
  "kk",
  "km",
  "kn",
  "ko",
  "ku",
  "ky",
  "lb",
  "lo",
  "lt",
  "lv",
  "me",
  "mi",
  "mk",
  "ml",
  "mn",
  "mr",
  "ms-my",
  "ms",
  "mt",
  "my",
  "nb",
  "ne",
  "nl-be",
  "nl",
  "nn",
  "oc-lnc",
  "pa-in",
  "pl",
  "pt-br",
  "pt",
  "rn",
  "ro",
  "ru",
  "rw",
  "sd",
  "se",
  "si",
  "sk",
  "sl",
  "sq",
  "sr-cyrl",
  "sr",
  "ss",
  "sv-fi",
  "sv",
  "sw",
  "ta",
  "te",
  "tet",
  "tg",
  "th",
  "tk",
  "tl-ph",
  "tlh",
  "tr",
  "tzl",
  "tzm-latn",
  "tzm",
  "ug-cn",
  "uk",
  "ur",
  "uz-latn",
  "uz",
  "vi",
  "x-pseudo",
  "yo",
  "zh-cn",
  "zh-hk",
  "zh-tw",
  "zh",
  "es-pr",
  "es-mx",
  "es-us",
];

const SUPPORTED_LOCALES_SET = new Set(SUPPORTED_LOCALES);

@ValidatorConstraint({ name: "IsValidDateLocale", async: false })
export class IsValidDateLocale implements ValidatorConstraintInterface {
  validate(text: string) {
    try {
      return SUPPORTED_LOCALES_SET.has(text);
    } catch (err) {
      return false;
    }
  }

  defaultMessage() {
    // here you can provide default error message if validation failed
    return `Invalid date locale. Must be one of ${SUPPORTED_LOCALES.join(",")}`;
  }
}
