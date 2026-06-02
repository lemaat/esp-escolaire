from django.urls import path
from .views import (
    CSRFTokenAPIView,
    ConnexionAPIView,
    DeconnexionAPIView,
    MonProfilAPIView,
    ChangerMotDePasseAPIView,
)

app_name = 'accounts'

urlpatterns = [
    path('api/csrf/', CSRFTokenAPIView.as_view(), name='api_csrf'),
    path('api/login/', ConnexionAPIView.as_view(), name='api_login'),
    path('api/logout/', DeconnexionAPIView.as_view(), name='api_logout'),
    path('api/me/', MonProfilAPIView.as_view(), name='api_mon_profil'),
    path('api/changer-mdp/', ChangerMotDePasseAPIView.as_view(), name='api_changer_mdp'),
]