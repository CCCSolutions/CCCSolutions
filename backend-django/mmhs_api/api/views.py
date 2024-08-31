from django.shortcuts import render
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.response import Response
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.parsers import JSONParser

from api.models import Forum
from api.serializers import ForumSerializer

# Create your views here.

# ======== FORUM views ========

@csrf_exempt
def forum_list(request):
    """
    Either list forums (get) or create forums (post)
    """
    # List Forums
    if request.method == 'GET':
        forums = Forum.objects.all()
        serializer = ForumSerializer(forums, many=True)

        # should it be safe=False ?
        return JsonResponse(serializer.data, safe=False)

    # Create Forum
    elif request.method == 'POST':
        data = JSONParser().parse(request)
        serializer = ForumSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, status=201)
        return JsonResponse(serializer.errors, status=400)

@csrf_exempt
def forum_detail(request, pk):
    """
    Get (one specifically), update or delete a forum.
    """
    try:
        forum = Forum.objects.get(pk=pk)
    except Forum.DoesNotExist:
        return HttpResponse(status=404)

    if request.method == 'GET':
        serializer = ForumSerializer(forum)
        return JsonResponse(serializer.data)

    elif request.method == 'PUT':
        data = JSONParser().parse(request)
        serializer = ForumSerializer(forum, data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data)
        return JsonResponse(serializer.errors, status=400)

    elif request.method == 'DELETE':
        forum.delete()
        return HttpResponse(status=204)
