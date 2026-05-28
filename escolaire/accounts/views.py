from django.contrib.auth import authenticate, login, logout
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

class ConnexionAPIView(APIView):
    """ Vue API pour connecter un utilisateur (gérée par React) """
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)

        if user is not None:
            login(request, user)
            return Response({
                "message": "Connexion réussie",
                "role": user.role,
                "username": user.username,
                "doit_changer_mdp": user.doit_changer_mdp,   # ← la seule ligne ajoutée
            }, status=status.HTTP_200_OK)

        return Response({
            "erreur": "Matricule ou mot de passe incorrect"
        }, status=status.HTTP_401_UNAUTHORIZED)


class DeconnexionAPIView(APIView):
    """ Vue API pour déconnecter un utilisateur """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"message": "Déconnexion réussie"}, status=status.HTTP_200_OK)


class MonProfilAPIView(APIView):
    """ Rend les informations de l'utilisateur connecté en JSON """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "doit_changer_mdp": user.doit_changer_mdp, 
        }
        
        # Si c'est un étudiant, on ajoute les détails de son cursus à l'ESP
        if user.role == 'ETUDIANT' and hasattr(user, 'profil_etudiant'):
            data["details"] = {
                "departement": user.profil_etudiant.departement,
                "annee": user.profil_etudiant.annee,
                "statut": user.profil_etudiant.statut,
            }
            
        # Si c'est un membre du personnel (Prof, Chef, Respo)
        elif user.role in ['PROFESSEUR', 'CHEF_DEPT', 'RESP_POLE'] and hasattr(user, 'profil_personnel'):
            data["details"] = {
                "specialite": user.profil_personnel.specialite,
                "bureau": user.profil_personnel.bureau,
                "pole_gere": user.profil_personnel.pole_gere,
                "departement_gere": user.profil_personnel.departement_gere,
            }
            
        return Response(data)
    

class ChangerMotDePasseAPIView(APIView):
    """ Permet à l'utilisateur connecté de changer son mot de passe. """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        ancien = request.data.get('ancien_mdp')
        nouveau = request.data.get('nouveau_mdp')

        # 1. Vérifier l'ancien mot de passe
        if not user.check_password(ancien):
            return Response(
                {"erreur": "Le mot de passe actuel est incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Validation basique du nouveau
        if not nouveau or len(nouveau) < 8:
            return Response(
                {"erreur": "Le nouveau mot de passe doit faire au moins 8 caractères."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Appliquer le changement
        user.set_password(nouveau)
        user.doit_changer_mdp = False   # le forçage est levé
        user.save()

        # 4. set_password invalide la session → on reconnecte
        login(request, user)

        return Response(
            {"message": "Mot de passe changé avec succès."},
            status=status.HTTP_200_OK,
        )