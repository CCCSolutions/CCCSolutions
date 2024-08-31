from django.shortcuts import render
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.response import Response
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.parsers import JSONParser

from api.models import Forum, Thread, Post, UserProfile
from api.serializers import ForumListSerializer, ForumDetailSerializer, ThreadListSerializer, ThreadDetailSerializer, PostSerializer, UserProfileSerializer

# Create your views here.

# ======== FORUM views ========

@csrf_exempt
def forum_list(request):
    """
    Either list forums (get) or create forums (post)
    """
    # List Forums (no detail)
    if request.method == 'GET':
        forums = Forum.objects.all()
        serializer = ForumListSerializer(forums, many=True)

        # should it be safe=False ?
        return JsonResponse(serializer.data, safe=False)

    # Create Forum
    elif request.method == 'POST':
        data = JSONParser().parse(request)
        serializer = ForumListSerializer(data=data)
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
        # includes all threads underneath
        serializer = ForumDetailSerializer(forum)
        return JsonResponse(serializer.data)

    elif request.method == 'PUT':
        data = JSONParser().parse(request)
        serializer = ForumDetailSerializer(forum, data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data)
        return JsonResponse(serializer.errors, status=400)

    elif request.method == 'DELETE':
        forum.delete()
        return HttpResponse(status=204)


@csrf_exempt
def create_thread(request):
    """
    Create a thread within a forum
    """
    if request.method == 'POST':
        data = JSONParser().parse(request)
        serializer = ThreadDetailSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, status=201)
        return JsonResponse(serializer.errors, status=400)

@csrf_exempt
def get_thread(request, pk):
    if request.method == 'GET':
        try:
            thread = Thread.objects.get(pk=pk)
        except Thread.DoesNotExist:
            return HttpResponse(status=404)

        # thread & all posts under the thread
        serializer = ThreadDetailSerializer(thread)
        return JsonResponse(serializer.data)
        
@csrf_exempt
def create_post(request):
    """
    Create a post in a thread
    """
    if request.method == 'POST':
        data = JSONParser().parse(request)
        serializer = PostSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, status=201)
        return JsonResponse(serializer.errors, status=400)
