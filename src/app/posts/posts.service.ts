import { Injectable } from '@angular/core';
import { Post } from './post.model';
import { Subject, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

const url = environment.apiUrl;
// const url = process.env.API_URL;
const urlPath = '/api/posts';

@Injectable({ providedIn: 'root' })
export class PostsService {
  private posts: Post[] = [];
  private postsChanged = new Subject<{ posts: Post[]; postCount: number }>();

  constructor(private http: HttpClient, private router: Router) {}

  getPost(id: string) {
    const constructedUrl = new URL(`${urlPath}/${id}`, url);

    return this.http.get<{
      _id: string;
      title: string;
      content: string;
      imagePath: string;
      creatorId: string;
    }>(constructedUrl.href);
  }

  getPosts(postsPerPage: number, currentPage: number) {
    const urlWithParams = new URL(urlPath, url);
    urlWithParams.searchParams.append('pagesize', `${postsPerPage}`);
    urlWithParams.searchParams.append('page', `${currentPage}`);

    this.http
      .get<{ message: String; posts: any; maxPosts: number }>(
        urlWithParams.href
      )
      .pipe(
        map((postData) => {
          return {
            posts: postData.posts.map((post) => {
              return {
                title: post.title,
                content: post.content,
                id: post._id,
                imagePath: post.imagePath,
                creatorId: post.creatorId,
              };
            }),
            maxPosts: postData.maxPosts,
          };
        })
      )
      .subscribe((transformedPostData) => {
        this.posts = transformedPostData.posts;
        this.postsChanged.next({
          posts: this.posts.slice(),
          postCount: transformedPostData.maxPosts,
        });
      });
  }

  getPostsUpdateListener() {
    return this.postsChanged.asObservable();
  }

  addPost(title: string, content: string, image: File) {
    const constructedUrl = new URL(urlPath, url);
    const postData = new FormData();
    postData.append('title', title);
    postData.append('content', content);
    postData.append('image', image, title);

    this.http
      .post<{ post: Post; message: string }>(constructedUrl.href, postData)
      .subscribe(() => {
        this.router.navigate(['/']);
      });
  }

  updatePost(id: string, title: string, content: string, image: File | string) {
    let postData: Post | FormData;
    const constructedUrl = new URL(`${urlPath}/${id}`, url);

    if (typeof image === 'object') {
      postData = new FormData();
      postData.append('id', id);
      postData.append('title', title);
      postData.append('content', content);
      postData.append('image', image, title);
    } else {
      postData = {
        id,
        title,
        content,
        imagePath: image as string,
        creatorId: null,
      };
    }
    this.http.put<any>(constructedUrl.href, postData).subscribe(() => {
      this.router.navigate(['/']);
    });
  }

  deletePost(id: string) {
    const constructedUrl = new URL(`${urlPath}/${id}`, url);

    return this.http.delete<{ message: string }>(constructedUrl.href);
  }
}
