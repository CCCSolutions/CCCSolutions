from rest_framework import serializers
from api.models import *

class ForumSerializer(serializers.ModelSerializer):
    # should title be readonly?

    class Meta:
        model = Forum
        fields = ['title', 'description']

class ThreadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Thread
        fields = ['forum', 'title', 'creator', 'created_at']

class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['thread', 'author', 'content', 'created_at']

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['user', 'contributions', 'username_color']
