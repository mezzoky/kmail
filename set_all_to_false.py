
if __name__ == '__main__':
    import os
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "kmail.settings")

    import django
    django.setup()

    import json
    with open('data.json', 'r', encoding='utf8') as io:
        raw = json.loads(io.read())

    for data in raw:
        data['sent'] = [False, False, False]

    with open('data.json', 'w', encoding='utf8') as io:
        json.dump(raw, io)
