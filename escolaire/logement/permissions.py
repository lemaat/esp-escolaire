from rest_framework.permissions import BasePermission


class IsStudent(BasePermission):
    """Autorise uniquement les utilisateurs avec le rôle ETUDIANT."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'ETUDIANT'
        )


class IsRespLogement(BasePermission):
    """Autorise uniquement les utilisateurs avec le rôle RESP_LOGEMENT."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'RESP_LOGEMENT'
        )
