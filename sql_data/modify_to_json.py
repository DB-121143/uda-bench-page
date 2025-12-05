import os
import re
import json

# 格式化SQL语句，确保在FROM、WHERE、GROUP BY、JOIN前加上换行符
def format_sql(sql):
    # 在FROM、WHERE、GROUP BY、JOIN前面插入换行符
    keywords = ['FROM', 'WHERE', 'GROUP BY', 'JOIN']
    for keyword in keywords:
        sql = re.sub(f'({keyword})', r'\n\1', sql)
    return sql

# 检查一个SQL语句的状态
def get_sql_state(sql):
    # a: 有SELECT
    a = 1 if 'SELECT' in sql else 0
    
    # b: WHERE的情况
    where_count = sql.count('WHERE')
    if where_count == 0:
        b = 0
    else:
        and_count = sql.count('AND')
        or_count = sql.count('OR')
        if and_count > 0 and or_count > 0:
            b = 4  # AND和OR都有
        elif and_count > 0:
            b = 2  # 只有AND
        elif or_count > 0:
            b = 3  # 只有OR
        else:
            b = 1  # 只有WHERE，没有AND/OR

    # c: GROUP, COUNT, MIN/MAX/AVG的情况
    group_by_count = sql.count('GROUP BY')
    count_count = sql.count('COUNT')
    min_max_avg_count = sum([sql.count(func) for func in ['MIN', 'MAX', 'AVG']])
    
    if group_by_count > 0:
        c = 1  # 有GROUP BY
    elif count_count > 0:
        c = 2  # 有COUNT
    elif min_max_avg_count > 0:
        c = 2  # 有MIN/MAX/AVG
    else:
        c = 0  # 没有GROUP BY, COUNT, MIN/MAX/AVG

    # d: JOIN的情况
    join_count = sql.count('JOIN')
    if join_count == 0:
        d = 0  # 没有JOIN
    elif join_count == 1:
        d = 1  # 只有1个JOIN
    else:
        d = 2  # 有多个JOIN

    # 返回四位状态
    return f'{a}{b}{c}{d}'

# 从文件中提取SQL语句
def extract_sql_from_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    # 正则表达式匹配SELECT语句
    sql_pattern = re.compile(r'SELECT.*?;', re.DOTALL)
    sqls = sql_pattern.findall(content)
    return sqls

# 读取文件夹中的所有SQL文件
def process_sql_files(folder_path):
    sqls_by_state = {}
    
    # 遍历文件夹中的所有文件
    for filename in os.listdir(folder_path):
        if filename.endswith('.sql'):
            file_path = os.path.join(folder_path, filename)
            sqls = extract_sql_from_file(file_path)
            for sql in sqls:
                # 格式化SQL语句
                formatted_sql = format_sql(sql)
                # 获取SQL语句的状态
                state = get_sql_state(formatted_sql)
                if state not in sqls_by_state:
                    sqls_by_state[state] = []
                sqls_by_state[state].append(formatted_sql)
    
    return sqls_by_state

# 输出为JSON文件
def save_to_json(output_path, data):
    with open(output_path, 'w', encoding='utf-8') as json_file:
        json.dump(data, json_file, ensure_ascii=False, indent=4)

# 主函数
def main(input_folder, output_json):
    sqls_by_state = process_sql_files(input_folder)
    save_to_json(output_json, sqls_by_state)

# 使用时提供文件夹路径和输出路径
if __name__ == '__main__':
    input_folder = "/home/lijianhui/worksp/gh-page/uda-bench-page/sql_data/medical"
    output_json = "/home/lijianhui/worksp/gh-page/uda-bench-page/src/assets/sql/medical.json"
    main(input_folder, output_json)
