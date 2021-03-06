import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { plainToClass } from 'class-transformer';
import { ToastrService } from 'ngx-toastr';
import { Project } from 'src/app/model/project.model';
import { Task } from 'src/app/model/task.model';
import { User } from 'src/app/model/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { ProjectService } from 'src/app/services/project.service';
import { UserService } from 'src/app/services/user.service';
import { TaskDialogComponent } from './task-dialog/task-dialog.component';

@Component({
  selector: 'app-project-view',
  templateUrl: './project-view.component.html',
  styleUrls: ['./project-view.component.scss']
})
export class ProjectViewComponent implements OnInit {


  projectForm: FormGroup;
  projectManagers: User[] = [];
  //selectedValue: string;
  project: Project;
  edit: boolean;
  new: boolean;


  constructor(private route: Router, private router: ActivatedRoute, private projectService: ProjectService,
    private userService: UserService, private toastr: ToastrService, public authService: AuthService) { }

  ngOnInit(): void {

    this.edit = false;
  
    this.authService.roleMatch(['Admin']) ? this.projectManagers = this.userService.projectManagers : this.projectManagers = [this.authService.loggedUser];

    this.router.paramMap.subscribe(paramMap => {
      if (paramMap.get('id') === 'new') {

        this.new = true;
        this.edit = true;
      } else {
        this.project = this.projectService.projects.find(data => data.id == +paramMap.get('id'));

      }

    });
    
    this.initForm();
  }

  initForm() {
    if((this.project==null || this.project == undefined) && !this.new){
      this.route.navigateByUrl('/home');
    }
    if (this.new) {

      if (this.authService.roleMatch(['Admin','ProjectManager']))
        this.projectForm = new FormGroup({

          project_name: new FormControl('', [Validators.required]),
          project_manager: new FormControl('', [Validators.required])

        })
      return;
    }

    this.projectForm = new FormGroup({

      project_name: new FormControl({ value: this.project.name, disabled: !this.edit }, [Validators.required]),
      project_manager: new FormControl({ value: this.projectManagers.find(x => x.username === this.project.projectManager.username), disabled: !this.edit }, [Validators.required])

    })
  }

  setProjectManager() {
    console.log(this.authService.loggedUser)
    return this.authService.loggedUser;
  }

  editMode() {
    this.edit = !this.edit;
    this.edit ? this.projectForm.get('project_name').enable() : this.projectForm.get('project_name').disable();
    if (this.authService.roleMatch(['ProjectManager'])) {
      this.projectForm.get('project_manager').disable();
    } else {
      this.edit ? this.projectForm.get('project_manager').enable() : this.projectForm.get('project_manager').disable();
    }
    if (this.new) {
      this.route.navigateByUrl('/home/project');
    }
  }

  saveChanges() {
    let projectManager: User;
    if(this.authService.roleMatch(['ProjectManager'])){
      projectManager = this.projectManagers[0];
    }else{
      projectManager = (this.userService.projectManagers.filter(x => x.username == this.projectForm.controls.project_manager.value.username))[0];
    }  

    let name = this.projectForm.controls.project_name.value;
    this.projectService.updateProject(this.project.id, projectManager.id, name)
      .subscribe((data: any) => {
        this.project.name = data.name;
        this.project.projectManager = plainToClass(User, data.projectManager);
        this.toastr.success("", "Successfully edited project!");
      })
    this.editMode();
  }

  saveProject() {
    let projectManager: User = this.projectForm.controls.project_manager.value;
    let name = this.projectForm.controls.project_name.value;
    console.log(projectManager)
    this.projectService.saveProject(projectManager.id, name)
      .subscribe((data: Project) => {
        console.log(data);
        var projectM = plainToClass(User, data.projectManager);
        var p = plainToClass(Project, data);
        p.projectManager = projectM;
        p.tasks = [];
        this.projectService.projects.push(p);
        this.project = data;
        this.edit = !this.edit;
        this.toastr.success("", "Successfully saved project!");
      })
  }


  deleteProject() {
    this.projectService.deleteProject(this.project.id)
      .subscribe((data: any) => {
        this.projectService.removeFromProjects(this.project);
        this.toastr.success("", "Successfully deleted project!");
        this.route.navigateByUrl('home/project');
      });
  }

  isEnableToDelete() {
    if (this.authService.roleMatch(['ProjectManager'])) {
      return false;
    }
    return true;
  }

  showMessage() {
    this.toastr.error("You are not enable to delete project", "Error");
  }
}


