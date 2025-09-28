#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Resources/Ornaments 폴더 구조를 스캔하여 ornaments.xml을 자동 생성하는 스크립트
"""

import os
import xml.etree.ElementTree as ET
from xml.dom import minidom
import re

def scan_ornaments_directory(base_path="Resources/Ornaments"):
    """
    Ornaments 디렉토리를 스캔하여 구조를 파악하고 XML 데이터를 생성
    """
    ornaments_data = []
    instrument_id = 1
    category_id = 1
    ornament_id = 1
    
    if not os.path.exists(base_path):
        print(f"경고: {base_path} 디렉토리가 존재하지 않습니다.")
        return ornaments_data
    
    # 악기별로 스캔
    for instrument_dir in sorted(os.listdir(base_path)):
        instrument_path = os.path.join(base_path, instrument_dir)
        if not os.path.isdir(instrument_path):
            continue
            
        # 악기명 추출 (예: "1_장구" -> "장구")
        instrument_name = extract_korean_name(instrument_dir)
        print(f"악기 처리 중: {instrument_dir} -> {instrument_name}")
        
        instrument_data = {
            'id': str(instrument_id),
            'name': instrument_name,
            'korean': instrument_name,
            'categories': []
        }
        
        # 카테고리별로 스캔
        for category_dir in sorted(os.listdir(instrument_path)):
            category_path = os.path.join(instrument_path, category_dir)
            if not os.path.isdir(category_path):
                continue
                
            # 카테고리명 추출
            category_name = extract_korean_name(category_dir)
            print(f"  카테고리 처리 중: {category_dir} -> {category_name}")
            
            category_data = {
                'id': str(category_id),
                'name': category_name,
                'korean': category_name,
                'ornaments': []
            }
            
            # 악상기호 파일들 스캔
            for filename in sorted(os.listdir(category_path)):
                if filename.lower().endswith('.png'):
                    # 파일명에서 악상기호명 추출
                    ornament_name = extract_ornament_name(filename)
                    
                    ornament_data = {
                        'id': str(ornament_id),
                        'name': ornament_name,
                        'filename': filename,
                        'description': f"{ornament_name} 시김새",
                        'autoalign': 'false',
                        'rightColumnOnly': 'false',
                        'imagePath': os.path.join(instrument_path, category_dir, filename).replace('\\', '/')
                    }
                    
                    category_data['ornaments'].append(ornament_data)
                    ornament_id += 1
                    print(f"    악상기호: {filename} -> {ornament_name}")
            
            if category_data['ornaments']:  # 악상기호가 있는 카테고리만 추가
                instrument_data['categories'].append(category_data)
                category_id += 1
        
        if instrument_data['categories']:  # 카테고리가 있는 악기만 추가
            ornaments_data.append(instrument_data)
            instrument_id += 1
    
    return ornaments_data

def extract_korean_name(dirname):
    """
    디렉토리명에서 한글 이름 추출
    예: "1_장구" -> "장구", "2_가야금" -> "가야금"
    """
    # 숫자_패턴 제거
    name = re.sub(r'^\d+_', '', dirname)
    return name

def extract_ornament_name(filename):
    """
    파일명에서 악상기호명 추출
    예: "1_덩(떵).png" -> "덩(떵)", "2_작은 덩.png" -> "작은 덩"
    """
    # 확장자 제거
    name = os.path.splitext(filename)[0]
    # 숫자_패턴 제거
    name = re.sub(r'^\d+_', '', name)
    return name

def create_xml(ornaments_data, output_path="Resources/ornaments.xml"):
    """
    ornaments_data를 XML 파일로 생성
    """
    root = ET.Element("ornaments")
    
    for instrument in ornaments_data:
        instrument_elem = ET.SubElement(root, "instrument")
        instrument_elem.set("id", instrument['id'])
        instrument_elem.set("name", instrument['name'])
        instrument_elem.set("korean", instrument['korean'])
        
        for category in instrument['categories']:
            category_elem = ET.SubElement(instrument_elem, "category")
            category_elem.set("id", category['id'])
            category_elem.set("name", category['name'])
            category_elem.set("korean", category['korean'])
            
            for ornament in category['ornaments']:
                ornament_elem = ET.SubElement(category_elem, "ornament")
                
                # 각 필드를 자식 요소로 추가
                for field, value in ornament.items():
                    field_elem = ET.SubElement(ornament_elem, field)
                    field_elem.text = str(value)
    
    # XML을 보기 좋게 포맷팅
    rough_string = ET.tostring(root, encoding='utf-8')
    reparsed = minidom.parseString(rough_string)
    pretty_xml = reparsed.toprettyxml(indent="  ", encoding='utf-8')
    
    # 빈 줄 제거
    lines = pretty_xml.decode('utf-8').split('\n')
    non_empty_lines = [line for line in lines if line.strip()]
    final_xml = '\n'.join(non_empty_lines)
    
    # 파일 저장
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(final_xml)
    
    print(f"XML 파일이 생성되었습니다: {output_path}")

def main():
    """
    메인 실행 함수
    """
    print("=== Ornaments XML 자동 생성기 ===")
    print("Resources/Ornaments 폴더를 스캔하여 ornaments.xml을 생성합니다...")
    
    # 현재 디렉토리에서 Resources/Ornaments 폴더 스캔
    ornaments_data = scan_ornaments_directory()
    
    if not ornaments_data:
        print("오류: 악상기호 데이터를 찾을 수 없습니다.")
        return
    
    print(f"\n총 {len(ornaments_data)}개의 악기를 발견했습니다.")
    
    # XML 파일 생성
    create_xml(ornaments_data)
    
    # 통계 출력
    total_categories = sum(len(instrument['categories']) for instrument in ornaments_data)
    total_ornaments = sum(
        len(category['ornaments']) 
        for instrument in ornaments_data 
        for category in instrument['categories']
    )
    
    print(f"\n=== 생성 완료 ===")
    print(f"악기: {len(ornaments_data)}개")
    print(f"카테고리: {total_categories}개")
    print(f"악상기호: {total_ornaments}개")
    
    # 악기별 상세 정보 출력
    print(f"\n=== 악기별 상세 정보 ===")
    for instrument in ornaments_data:
        print(f"\n{instrument['name']}:")
        for category in instrument['categories']:
            print(f"  - {category['name']}: {len(category['ornaments'])}개")

if __name__ == "__main__":
    main()
