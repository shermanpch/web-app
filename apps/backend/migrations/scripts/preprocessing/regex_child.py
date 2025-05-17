import re


def extract_changing_line(text):
    # Extract text between 详解 and before 辞 in the first 2 lines
    line_info_pattern = r"详解\n(.*?)辞"
    line_info_match = re.search(line_info_pattern, text, re.DOTALL)
    line_info = line_info_match.group(1).strip() if line_info_match else None
    return {"Changing Line Number": line_info}


def extract_ancient_text(text):
    # Extract the Yao text between 爻辞 and 白话文解释
    ancient_text_pattern = r"爻辞\n(.*?)(?=\n白话文解释)"
    ancient_text_match = re.search(ancient_text_pattern, text, re.DOTALL)
    ancient_text = ancient_text_match.group(1).strip() if ancient_text_match else None
    return {"Ancient Chinese Text": ancient_text}


def extract_modern_text(text):
    # Extract the modern Chinese explanation between 白话文解释 and 北宋易学家邵雍解
    modern_text_pattern = r"白话文解释\n(.*?)(?=\n北宋易学家邵雍解)"
    modern_text_match = re.search(modern_text_pattern, text, re.DOTALL)
    modern_text = modern_text_match.group(1).strip() if modern_text_match else None
    return {"Modern Chinese Text": modern_text}


def extract_expert_explanation(text):
    # Extract between 北宋易学家邵雍解 and 台湾国学大儒傅佩荣解
    pattern = r"北宋易学家邵雍解\n(.*?)(?=\n台湾国学大儒傅佩荣解)"
    match = re.search(pattern, text, re.DOTALL)
    return {"Expert's Explanation": match.group(1).strip() if match else None}


def extract_specific_divination(text):
    # Extract divination between 台湾国学大儒傅佩荣解 and XX变卦
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

    # Find the starting position
    start_index = text.find("台湾国学大儒傅佩荣解")
    if start_index == -1:
        return {}

    # Find the ending position
    end_index = text.find("变卦", start_index)
    if end_index == -1:
        return {}

    # Extract the section before "变卦" but after the header line
    start_of_content = text.find("\n", start_index) + 1
    section_text = text[start_of_content:end_index].strip()

    # Parse key-value pairs
    key_value_pairs = {}
    for line in section_text.split("\n"):
        if "：" in line:
            key, value = line.split("：", 1)
            key = key.strip()
            if key in key_mapping:
                english_key = key_mapping[key]
                key_value_pairs[english_key] = value.strip()

    return key_value_pairs


def extract_final_hexagram_number(text):
    # Extract the final hexagram number after 动变得周易
    final_hexagram_pattern = r"动变得周易(第.+?卦)"
    final_hexagram_match = re.search(final_hexagram_pattern, text)
    final_hexagram = final_hexagram_match.group(1) if final_hexagram_match else None
    return {"Final Hexagram Number": final_hexagram}


def extract_final_hexagram_name(text):
    # Extract hexagram name between 第XX卦： and 。
    name_pattern = r"第\d+卦：(.+?)。"
    name_match = re.search(name_pattern, text)
    hexagram_name_description = name_match.group(1) if name_match else None
    return {"Final Hexagram Name": hexagram_name_description}


def extract_final_hexagram_explanation(text):
    # Extract the philosophical meaning after 的哲学含义 until the end of text
    explanation_pattern = r"的哲学含义\n([\s\S]+)$"
    explanation_match = re.search(explanation_pattern, text)
    explanation_meaning = (
        explanation_match.group(1).strip() if explanation_match else None
    )
    return {"Explanation": explanation_meaning}


def extract_child_hexagram(text):
    final_hexagram = {}
    final_hexagram.update(extract_final_hexagram_number(text))
    final_hexagram.update(extract_final_hexagram_name(text))
    final_hexagram.update(extract_expert_explanation(text))

    return {
        "Change": {
            "Changing Line": extract_changing_line(text),
            "Ancient Chinese Text": extract_ancient_text(text),
            "Modern Chinese Text": extract_modern_text(text),
            "Expert's Explanation": extract_expert_explanation(text),
            "Specific Divination": extract_specific_divination(text),
        },
        "Final Hexagram": final_hexagram,
    }
