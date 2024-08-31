from django.db import models
from django.contrib.auth.models import User

class Forum(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()

    def __str__(self):
        return self.title

class Thread(models.Model):
    forum = models.ForeignKey(Forum, related_name='threads', on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    creator = models.ForeignKey(User, related_name='threads', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Post(models.Model):
    thread = models.ForeignKey(Thread, related_name='posts', on_delete=models.CASCADE)
    author = models.ForeignKey(User, related_name='posts', on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Post by {self.author} on {self.created_at}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    contributions = models.IntegerField(default=0)
    username_color = models.CharField(max_length=7, default='#000000')  # Hex color code

    def update_username_color(self):
        if self.contributions > 100:
            self.username_color = '#FFD700'  # Gold
        elif self.contributions > 50:
            self.username_color = '#C0C0C0'  # Silver
        elif self.contributions > 20:
            self.username_color = '#CD7F32'  # Bronze
        else:
            self.username_color = '#000000'  # Default black

        self.save()

    def __str__(self):
        return f"{self.user.username} Profile"
