from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # L'interface d'administration classique de Django (Utile pour vous, les admins)
    path('admin/', admin.site.urls),
    
    # Inclusion des routes d'API de votre application accounts
    path('accounts/', include('accounts.urls')),
    path('inscriptions/', include('inscriptions.urls')), 
    path('logement/', include('logement.urls')),
    # Au fur et à mesure du projet, vos camarades ajouteront leurs routes d'API ici :
    # path('academique/', include('academique.urls')),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)