"""kmail URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.8/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Add an import:  from blog import urls as blog_urls
    2. Add a URL to urlpatterns:  url(r'^blog/', include(blog_urls))
"""
from django.conf.urls import include, url
from django.contrib import admin
from django.views.generic.base import TemplateView
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

# from mailapp.views import mailView
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied


class LoginRequiredMixin(object):

    def get(self, request):
        print(request.user)
        if request.user.is_authenticated():
            return super(LoginRequiredMixin, self).get(request)
        return HttpResponse('You should login as an administrator!<br>And you should know the login path as well! ;)', status=403)
        # raise PermissionDenied

    @classmethod
    def as_view(cls, **initkwargs):
        # pass
        print(initkwargs)
        return super(LoginRequiredMixin, cls).as_view(**initkwargs)

        # view = super(LoginRequiredMixin, cls).as_view(**initkwargs)
        # print(initkwargs)
        # print()
        # view = super(LoginRequiredMixin, cls).as_view(**initkwargs)
        # return login_required(view)


class SinglePage(LoginRequiredMixin,    TemplateView):
    template_name = 'kmail/index.html'

    @method_decorator(ensure_csrf_cookie)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)


admin.site.site_header = 'Mail App Admin Entrance!'
admin.site.site_title = 'Mail App'
admin.site.site_index = '@dmin'

urlpatterns = [
    url(r'^@dmin/', include(admin.site.urls)),
    url(r'api/v1/', include('mailapp.urls', namespace='mailapp')),
    url(r'^.*$', SinglePage.as_view(), name='spa')
    # url(r'^$', mailView, name='home'),
]
