from django.conf.urls import url, patterns
from mailapp import views

urlpatterns = [
    # url(
    #     regex=r"^$",
    #     view=views.HomeView.as_view(),
    #     name='home'
    # ),
    url(
        regex=r"^save-mail/$",
        view=views.SaveMail.as_view(),
        name='save-mail'
    ),
    url(
        regex=r"^send-mail/$",
        view=views.SendMail.as_view(),
        name='send-mail'
    ),
    url(
        regex=r"^column/$",
        view=views.Column.as_view(),
        name='column'
    ),
]
