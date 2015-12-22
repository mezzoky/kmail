from rest_framework.parsers import FileUploadParser, JSONParser, MultiPartParser
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.mail import send_mail
from django.core.mail import EmailMessage
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import get_connection
import json
import time
# Create your views here.


class Column(APIView):
    parser_classes = (JSONParser,)

    def get(self, request):
        try:
            with open('column.json', 'r', encoding='utf8') as io:
                data = io.read()
            return Response(json.loads(data))
        except:
            return Response(['', '', '', '', '', ''])

    def post(self, request):
        if not request.user.is_authenticated():
            return Response('', status=403)
        print(request.data)
        with open('column.json', 'w', encoding='utf8') as io:
            json.dump(request.data, io)
        return Response({
            'message': 'done',
        })


class SaveMail(APIView):
    parser_classes = (JSONParser,)

    def get(self, request):
        if not request.user.is_authenticated():
            return Response('', status=403)

        try:
            with open('data.json', 'r', encoding='utf8') as io:
                data = io.read()
            time.sleep(0)
            return Response(json.loads(data))
        except:

            return Response([])

    def post(self, request, format=None):
        if not request.user.is_authenticated():
            return Response('', status=403)
        #print(request.data)
        time.sleep(0)

        with open('data.json', 'w', encoding='utf8') as io:
            json.dump(request.data, io)
        
        # email2 = EmailMessage(
        #         subject='Message 2 from the Heaven.',
        #         body='Hi there, Im Heaven.',
        #         from_email='from@example.com',
        #         to=['dummyOne@example.com', 'BravoTwo@example.com'],
        # )
        # email3 = EmailMessage(
        #         subject='Message 3 from the Heaven.',
        #         body='Hi there, Im Heaven.',
        #         from_email='from@example.com',
        #         to=['ymezzoky@gmail.com', 'BravoTwo@example.com'],
        # )
        # connection.send_messages([email2, email3])
        # connection.close()
        return Response({
            'message': 'done',
        })


class SendMail(APIView):

    parser_classes = (MultiPartParser,)

    def post(self, request):
        print(request.user)
        #if not request.user.is_authenticated():
        #    return Response('', status=403)
        print(request.data)

        # with open('something.pdf', 'wb+') as io:
        #     for chunk in request.data['file'].chunks():
        #         io.write(chunk)

        subject = request.data['title']
        body = request.data['message']
        to = request.data['to'].replace(' ', '')
        cc = request.data['cc'].replace(' ', '').split(',')
        
        print(subject)
        print(body)
        print(to)
        print(cc)

        connection = get_connection()
        connection.open()
        email = EmailMessage(
                subject=subject,
                body=body,
                to=[to],
                # bcc=['bcc@one.net', 'bcc2@two.com', 'some@bcc.cc'],
                # reply_to=['ymezzoky@gmail.com'],
                # headers={'Message-ID': 'foo'},
                cc=cc,
                connection=connection,
                # attachments=
        )
        for pdf in request.FILES.getlist('files'):
            print(pdf.name, pdf.content_type, type(pdf))
            email.attach(pdf.name, pdf.read(), pdf.content_type)

        email.send()
        return Response({
            'message': 'done',
            })
