import csv
import json
import os
from typing import Any, Set


def collect_names_from_json_folder(folder: str) -> Set[str]:
    """Collect lowercase `name` fields from all JSON files under a folder."""
    names: Set[str] = set()
    if not folder or not os.path.isdir(folder):
        return names

    def _extract(obj: Any):
        if isinstance(obj, dict):
            name_val = obj.get("name")
            if isinstance(name_val, str) and name_val.strip():
                names.add(name_val.strip().lower())
            for v in obj.values():
                _extract(v)
        elif isinstance(obj, list):
            for item in obj:
                _extract(item)

    for root, _, files in os.walk(folder):
        for fname in files:
            if not fname.endswith(".json"):
                continue
            path = os.path.join(root, fname)
            try:
                with open(path, "r", encoding="utf-8") as jf:
                    data = json.load(jf)
                    _extract(data)
            except Exception:
                # 忽略坏文件，保持脚本健壮
                continue

    return names


def convert_csv_to_json(csv_file: str, json_file: str, name_dir: str | None = None):
    try:
        allowed_names = collect_names_from_json_folder(name_dir) if name_dir else set()

        with open(csv_file, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            data = []

            # 遍历CSV文件中的每一行
            for idx, row in enumerate(reader):
                if idx >= 10:  # 仅转换前 10 行
                    break
                item: dict[str, Any] = {}

                # 提取ID列并转换为整数的字符串（若可解析为数值）
                if "id" in row:
                    raw_id = row["id"]
                    if raw_id is None:
                        pass
                    else:
                        text_id = str(raw_id).strip()
                        try:
                            # 支持整数或小数，统一转成整数的字符串
                            num_id = float(text_id)
                            item["id"] = str(int(num_id))
                        except (ValueError, TypeError):
                            # 非数字则按原始字符串保留
                            item["id"] = text_id

                # 遍历CSV的列，将列名转换为小写，并处理属性列和证据列
                for key, value in row.items():
                    key_lower = key.strip().lower()  # 将列名转换为小写
                    if key_lower.endswith("_evidence"):
                        # 证据列的处理：提取属性列名称并加上_source
                        base_key = key_lower.replace("_evidence", "")
                        if allowed_names and base_key not in allowed_names:
                            continue
                        item[base_key + "_source"] = value
                    elif key_lower != "id":  # 跳过ID列
                        if allowed_names and key_lower not in allowed_names:
                            continue
                        item[key_lower] = value

                # 将当前行数据添加到列表
                data.append(item)

        # 将数据写入到JSON文件
        with open(json_file, mode="w", encoding="utf-8") as jf:
            json.dump(data, jf, ensure_ascii=False, indent=4)

        print(f"CSV文件成功转换为JSON格式，保存至 {json_file}")

    except FileNotFoundError:
        print(f"错误：文件 {csv_file} 未找到。")
    except Exception as e:
        print(f"发生错误: {e}")

# 使用示例
if __name__ == '__main__':
    # datasets = {'player' : {'dir':'Player', 'table':['city', 'manager', 'player', 'team'], 'totable':['city', 'manager', 'player', 'team']}, 
    #             'art': {'dir':'Art', 'table':['Art'], 'totable':['art']},
    #             'cspaper': {'dir':'CSPaper', 'table':['CSPaper'], 'totable':['cspaper']}, 
    #             'finance': {'dir':'Finan', 'table':['Finan'], 'totable':['finance']},
    #             'healthcare': {'dir':'Med', 'table':['disease', 'institution', 'drug'], 'totable':['disease', 'institution', 'drug']},
    #             'legal': {'dir':'Legal', 'table':['Legal'], 'totable':['legal']}}
    # for dataset_name, dataset in datasets.items():
    #     for i, table in enumerate(dataset['table']):
    #         csv_file = f'/home/lijianhui/worksp/UDA-Bench/Data/Evidence/{dataset["dir"]}/{dataset["totable"][i]}.csv'  # 输入CSV文件名
    #         json_file = f'/home/lijianhui/worksp/gh-page/uda-bench-page/src/assets/table/{dataset_name}/{dataset["totable"][i]}.json'    # 输出JSON文件名
    #         name_dir = '/home/lijianhui/worksp/gh-page/uda-bench-page/src/assets/descriptions'  # 含有 name 字段的 JSON 目录
    #         convert_csv_to_json(csv_file, json_file, name_dir)
        
    csv_file = '/home/lijianhui/worksp/UDA-Bench/Data/Med/institution.csv'  # 输入CSV文件名
    json_file = '/home/lijianhui/worksp/gh-page/uda-bench-page/src/assets/table/healthcare/institution.json'    # 输出JSON文件名
    name_dir = '/home/lijianhui/worksp/gh-page/uda-bench-page/src/assets/descriptions'  # 含有 name 字段的 JSON 目录
    convert_csv_to_json(csv_file, json_file, name_dir)
