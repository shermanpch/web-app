import re


def extract_hexagram_info(text):
    # Extract the full hexagram phrase (like 第二卦 or 第十一卦)
    hexagram_pattern = r"(第[\u4e00-\u9fff]+卦)"
    hexagram_match = re.search(hexagram_pattern, text)
    hexagram_number = hexagram_match.group(1) if hexagram_match else None

    # Extract the hexagram name (like 坤卦 or 豫卦)
    # Looking for Chinese characters followed by 卦 at the beginning of a line
    hexagram_name_pattern = r"^([\u4e00-\u9fff]+卦)原文"
    hexagram_name_match = re.search(hexagram_name_pattern, text, re.MULTILINE)
    hexagram_name = hexagram_name_match.group(1) if hexagram_name_match else None
    result = {
        "Hexagram Number": hexagram_number,
        "Hexagram Name": hexagram_name,
    }
    return result


def extract_ancient_text(text):
    # Extract the ancient Chinese text (between 原文 and 白话文解释)
    ancient_text_pattern = r"原文\n(.*?)(?=\n白话文解释)"
    ancient_text_match = re.search(ancient_text_pattern, text, re.DOTALL)
    ancient_text = ancient_text_match.group(1).strip() if ancient_text_match else None
    return {"Ancient Chinese Text": ancient_text}


def extract_modern_text(text):
    # Extract the modern Chinese text (between 白话文解释 and after the line following 《断易天机》解)
    modern_text_pattern = r"白话文解释\n(.*?《断易天机》解\n.*?\n)"
    modern_text_match = re.search(modern_text_pattern, text, re.DOTALL)
    modern_text = modern_text_match.group(1).strip() if modern_text_match else None
    return {"Modern Chinese Text": modern_text}


def extract_expert_explanation(text):
    # Extract between 北宋易学家邵雍解 and 台湾国学大儒傅佩荣解
    pattern = r"北宋易学家邵雍解\n(.*?)(?=\n台湾国学大儒傅佩荣解)"
    match = re.search(pattern, text, re.DOTALL)
    return {"Expert's Explanation": match.group(1).strip() if match else None}


def extract_specific_divination(text):
    # Find all pattern matches for "XXX：YYY" from after 台湾国学大儒傅佩荣解
    # up until 第X卦的哲学含义

    key_mapping = {
        "时运": "General Luck",
        "财运": "Wealth",
        "家宅": "Family",
        "身体": "Body/Health",
        "大象": "General Situation",
        "运势": "Luck Trend",
        "事业": "Career",
        "经商": "Business",
        "求名": "Promotion",
        "婚恋": "Relationships",
        "决策": "Decision Making",
    }

    # First, extract the relevant section of text
    section_pattern = r"台湾国学大儒傅佩荣解\n(.*?)(?=\n[\u4e00-\u9fff]+含义|$)"
    section_match = re.search(section_pattern, text, re.DOTALL)

    if not section_match:
        return {}

    section_text = section_match.group(1).strip()

    # Find all key-value pairs in this section that start at the beginning of a line
    kv_pattern = r"^([\u4e00-\u9fff]+)：([^\n]+)"
    matches = re.findall(kv_pattern, section_text, re.MULTILINE)

    # Convert matches to a dictionary
    key_value_pairs = {}
    for key, value in matches:
        if key in key_mapping:
            english_key = key_mapping[key]
            key_value_pairs[english_key] = value.strip()

    return key_value_pairs


def extract_parent_hexagram(text):
    explanation = {}
    explanation.update(extract_ancient_text(text))
    explanation.update(extract_modern_text(text))
    explanation.update(extract_expert_explanation(text))

    return {
        "Hexagram": extract_hexagram_info(text),
        "Explanation": explanation,
        "Specific Divination": extract_specific_divination(text),
    }
