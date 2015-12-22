
if __name__ == '__main__':
    """
    will have this to run as cron task
    """
    import os
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "kmail.settings")

    import django
    django.setup()

    from django.core.mail import get_connection
    from django.core.mail import EmailMessage

    import json
    import sys
    from datetime import datetime

    filename = sys.argv[1]

    print('{} [INFO] running the script'.format(datetime.now()))

    def monthdelta(date, delta):
        """Source from http://stackoverflow.com/posts/3425124/revisions
        """
        raw_month = date.month + delta
        month = raw_month % 12
        year = date.year + (raw_month - 1) // 12
        if month == 0:
            month = 12
        day = min(date.day, [
            31,
            29 if year % 4 == 0 and not year % 400 == 0 else 28,
            31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month-1])
        return date.replace(day=day, month=month, year=year)

    def send_mail(subject, body, to, cc):
        to = to.replace(' ', '')
        cc = ','.join(cc).replace(' ', '').split(',')

        connection = get_connection()
        connection.open()
        email = EmailMessage(
                subject=subject,
                body=body,
                to=[to],
                # bcc=['bcc@one.net', 'bcc2@two.com', 'some@bcc.cc'],
                # reply_to=['ymezzoky@gmail.com'],
                headers={'Message-ID': 'foo'},
                cc=cc,
                connection=connection,
                # attachments=
        )
        email.send()
        print('{} [SUCCESS SENT MAIL] title:<{}>'.format(datetime.now(), subject))

    with open(filename, 'r', encoding='utf8') as io:
        raw = json.loads(io.read())

    for data in raw:
        if 'sent' not in data:
            data['sent'] = [False, False, False]

        for month in range(3):
            if data['sent'][month]:
                continue
            body = data['messages'][month]
            subject = data['titles'][month]
            end_at = data['end']
            try:
                ''' will cause error if the end is empty
                    we dont want the program to stop even
                    if an error occur
                '''
                end_date = datetime.strptime(end_at, '%Y-%m-%dT%H:%M:%S.%fZ')
                '''
                promised_month to notice the 3rd, 2nd, 1st month before
                expire/end_date
                -3 -2 -1 '''
                promised_month = monthdelta(end_date, -(3 - month))

                ''' compare with date e.g. 2017-01-02 '''
                can_send = (
                    promised_month.date() <= datetime.now().date() and
                    promised_month.month == datetime.now().month and
                    not data['sent'][month]
                )
                if can_send:
                    #print('can send')
                    send_mail(subject, body, data['to'], data['cc'])
                    data['sent'][month] = True
            except Exception as e:
                print('{} [ERROR] title:<{}> error:<{}>'.format(datetime.now(), subject, e))
                continue

    with open(filename, 'w', encoding='utf8') as io:
        json.dump(raw, io)
