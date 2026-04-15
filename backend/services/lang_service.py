from langdetect import detect, LangDetectException

LANGUAGE_NAMES = {
    "en": "inglés",
    "es": "español",
    "fr": "francés",
    "pt": "portugués",
    "de": "alemán",
    "it": "italiano",
}


def detect_language(text: str) -> tuple[str, str]:
    """Returns (language_code, language_name_in_spanish)"""
    try:
        lang_code = detect(text)
        lang_name = LANGUAGE_NAMES.get(lang_code, lang_code)
        return lang_code, lang_name
    except LangDetectException:
        return "unknown", "desconocido"
