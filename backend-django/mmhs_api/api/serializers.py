from rest_framework import serializers
from api.models import *

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['user', 'contributions', 'username_color']

class PostSerializer(serializers.ModelSerializer):
    author = UserProfileSerializer(many=False, read_only=True)  # readonly?

    class Meta:
        model = Post
        fields = ['thread', 'author', 'content', 'created_at']

class ThreadListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Thread
        fields = ['forum', 'title', 'creator', 'created_at']

class ThreadDetailSerializer(serializers.ModelSerializer):
    posts = PostSerializer(many=True, read_only=True)
    
    class Meta:
        model = Thread
        fields = ['forum', 'title', 'creator', 'created_at', 'posts']

class ForumListSerializer(serializers.ModelSerializer):
    # should title be readonly?

    class Meta:
        model = Forum
        fields = ['title', 'description']

class ForumDetailSerializer(serializers.ModelSerializer):
    threads = ThreadListSerializer(many=True, read_only=True)

    class Meta:
        model = Forum
        fields = ['title', 'description', 'threads']
