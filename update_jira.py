import xml.etree.ElementTree as ET
import os

tree = ET.parse('documentation/Jira.xml')
root = tree.getroot()

ACCOUNTS = {
    'Afif Nur Sena': '712020:701e2725-c56b-4534-96a3-858fde8a695c',
    'yonathan hezron': '712020:4d66249c-01a9-4311-856c-7a524ba49ea6',
    'isabella widia putri': '712020:c2c1eb74-95f6-4d35-9660-8c086f364468',
    'ALIFFIA HUMAIRA': '712020:93c255bd-befe-41f1-9894-eab23abb882e',
    'Muhammad Rayfan Pashya': '712020:092f66fd-d935-41dd-97d8-85a8f66edf6f',
    'NIKEN CITRA SUHISMAN': '712020:29c37fc7-cd1c-47fb-bd87-733639e8bed8',
    'REFA DIAS I DELIA': '712020:02c6fa45-b352-4ce0-b3a9-8731591fc3c1',
    'AHMAD ZACKY AL-BAQRI': '712020:2a7118aa-6774-4ec5-a39a-8dca6a6179c5'
}

REASSIGNMENTS = {
    'SCRUM-63': 'yonathan hezron',
    'SCRUM-62': 'yonathan hezron',
    'SCRUM-61': 'yonathan hezron',
    'SCRUM-50': 'yonathan hezron',
    'SCRUM-46': 'yonathan hezron',
    'SCRUM-45': 'yonathan hezron',
    'SCRUM-27': 'yonathan hezron',
    'SCRUM-57': 'REFA DIAS I DELIA',
    'SCRUM-56': 'REFA DIAS I DELIA',
    'SCRUM-30': 'Afif Nur Sena',
    'SCRUM-24': 'Afif Nur Sena',
    'SCRUM-23': 'Afif Nur Sena',
    'SCRUM-22': 'Afif Nur Sena',
    'SCRUM-19': 'Afif Nur Sena',
    'SCRUM-52': 'NIKEN CITRA SUHISMAN',
    'SCRUM-36': 'NIKEN CITRA SUHISMAN',
    'SCRUM-35': 'NIKEN CITRA SUHISMAN',
    'SCRUM-34': 'NIKEN CITRA SUHISMAN',
    'SCRUM-31': 'NIKEN CITRA SUHISMAN',
    'SCRUM-25': 'NIKEN CITRA SUHISMAN',
    'SCRUM-51': 'ALIFFIA HUMAIRA',
    'SCRUM-44': 'ALIFFIA HUMAIRA',
    'SCRUM-41': 'ALIFFIA HUMAIRA',
    'SCRUM-40': 'ALIFFIA HUMAIRA',
    'SCRUM-39': 'ALIFFIA HUMAIRA',
    'SCRUM-32': 'ALIFFIA HUMAIRA',
    'SCRUM-29': 'ALIFFIA HUMAIRA',
    'SCRUM-49': 'AHMAD ZACKY AL-BAQRI',
    'SCRUM-48': 'AHMAD ZACKY AL-BAQRI',
    'SCRUM-47': 'AHMAD ZACKY AL-BAQRI',
    'SCRUM-42': 'AHMAD ZACKY AL-BAQRI',
    'SCRUM-28': 'AHMAD ZACKY AL-BAQRI',
    'SCRUM-38': 'isabella widia putri',
    'SCRUM-33': 'isabella widia putri',
    'SCRUM-43': 'Muhammad Rayfan Pashya',
    'SCRUM-37': 'Muhammad Rayfan Pashya',
    'SCRUM-26': 'Muhammad Rayfan Pashya'
}

count_updated = 0
for item in root.findall('.//item'):
    key_node = item.find('key')
    if key_node is None: continue
    issue_key = key_node.text
    
    status_node = item.find('status')
    if status_node is not None and status_node.text == 'Done':
        continue
        
    if issue_key in REASSIGNMENTS:
        new_name = REASSIGNMENTS[issue_key]
        new_id = ACCOUNTS[new_name]
        
        assignee_node = item.find('assignee')
        if assignee_node is not None:
            assignee_node.text = new_name
            assignee_node.attrib['accountid'] = new_id
        else:
            assignee_node = ET.SubElement(item, 'assignee', attrib={'accountid': new_id})
            assignee_node.text = new_name
            
        count_updated += 1
        print(f'Updated {issue_key} -> {new_name}')

tree.write('documentation/Jira.xml', encoding='utf-8', xml_declaration=False)
print('Total updated:', count_updated)
