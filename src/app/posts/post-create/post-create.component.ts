import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Post } from '../post.model';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  NgForm,
  Validators,
} from '@angular/forms';
import { PostsService } from '../posts.service';
import { ActivatedRoute } from '@angular/router';
import { mimeType } from './mime-type.validator';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-post-create',
  templateUrl: './post-create.component.html',
  styleUrls: ['./post-create.component.css'],
})
export class PostCreateComponent implements OnInit, OnDestroy {
  @ViewChild(FormGroupDirective) myForm: NgForm;
  form: FormGroup;
  post: Post;
  isLoading = false;
  imagePreview: string;
  private mode = 'create';
  private postId: string;
  private authStatusSub: Subscription;

  constructor(
    private postsService: PostsService,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authStatusSub = this.authService
      .getAuthStatusListener()
      .subscribe((authStatus) => {
        this.isLoading = false;
      });

    this.form = new FormGroup({
      title: new FormControl(null, [
        Validators.required,
        Validators.minLength(3),
      ]),
      content: new FormControl(null, [Validators.required]),
      image: new FormControl(null, [Validators.required], [mimeType]),
    });

    this.route.paramMap.subscribe((paramMap) => {
      this.mode = paramMap.has('postId') ? 'edit' : 'create';
      this.postId = paramMap.get('postId');

      if (this.mode === 'create') {
        this.isLoading = false;
      } else {
        this.isLoading = true;
      }

      if (this.postId != null) {
        this.postsService.getPost(this.postId).subscribe((postData) => {
          this.isLoading = false;
          this.post = {
            id: postData._id,
            title: postData.title,
            content: postData.content,
            imagePath: postData.imagePath,
            creatorId: postData.creatorId,
          };
          this.form.setValue({
            title: this.post.title,
            content: this.post.content,
            image: this.post.imagePath,
          });
        });
      }
    });
  }

  onSavePost() {
    if (this.form.invalid) {
      return;
    }
    this.isLoading = true;

    if (this.mode === 'edit') {
      this.postsService.updatePost(
        this.postId,
        this.form.value.title,
        this.form.value.content,
        this.form.value.image
      );
    } else {
      this.postsService.addPost(
        this.form.value.title,
        this.form.value.content,
        this.form.value.image
      );
    }
    this.myForm.resetForm();
  }

  onImagePicked(event: Event) {
    const file = (<HTMLInputElement>event.target).files[0];
    this.form.patchValue({ image: file });
    this.form.get('image').updateValueAndValidity();
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = <string>reader.result;
    };
    reader.readAsDataURL(file);
  }

  ngOnDestroy(): void {
    this.authStatusSub.unsubscribe();
  }
}
