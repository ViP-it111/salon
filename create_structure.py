import xml.etree.ElementTree as ET
import os

def create_structure(xml_path, output_dir="."):
    tree = ET.parse(xml_path)
    root = tree.getroot()

    project_name = root.get("name", "project")
    project_path = os.path.join(output_dir, project_name)

    def walk(element, current_path):
        for child in element:
            name = child.get("name")
            if not name:
                continue

            target = os.path.join(current_path, name)

            if child.tag == "dir":
                os.makedirs(target, exist_ok=True)
                walk(child, target)
            elif child.tag == "file":
                with open(target, "w", encoding="utf-8") as f:
                    pass

    os.makedirs(project_path, exist_ok=True)
    walk(root, project_path)
    print(f"Готово! Структура создана в: {os.path.abspath(project_path)}")

if __name__ == "__main__":
    import sys
    xml_file = sys.argv[1] if len(sys.argv) > 1 else "beauty-salon.xml"
    create_structure(xml_file, ".")