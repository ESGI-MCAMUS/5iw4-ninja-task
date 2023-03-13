import { Controller } from '@nestjs/common';
import { TaskService } from './task.service';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { Status as StatusFromPrisma } from '@prisma/client';
import {
  CreateTaskRequest,
  DeleteTaskRequest,
  GetTaskRequest,
  ListTasksRequest,
  ListTasksResponse,
  Status,
  Task,
  UpdateTaskRequest,
} from 'src/stubs/task/v1alpha/task';

@Controller()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @GrpcMethod('TaskService')
  createTask(data: CreateTaskRequest) {
    if (!data.task) {
      throw new RpcException({ code: 400, message: 'Task is required' });
    } else if (!data.task.title || !data.task.description) {
      throw new RpcException({
        code: 400,
        message: 'Task title, description, status and dueDate are required',
      });
    }

    const newTask = data.task;

    return this.taskService.create(newTask as any);
  }

  @GrpcMethod('TaskService')
  async ListTasks(request: ListTasksRequest): Promise<ListTasksResponse> {
    const tasks = await this.taskService.findAll();
    console.log({ tasks });

    const res = ListTasksResponse.create({
      tasks: tasks.map((t) =>
        Task.create({
          title: t.title,
        }),
      ),
    });

    console.log({ res });

    return res;
  }

  @GrpcMethod('TaskService')
  async GetTask(request: GetTaskRequest): Promise<Task> {
    if (!request.id) {
      throw new RpcException({ code: 400, message: 'Task id is required' });
    } else if (isNaN(Number(request.id))) {
      throw new RpcException({
        code: 400,
        message: 'Task id must be a number',
      });
    }
    const task = await this.taskService.findById(Number(request.id));

    if (!task) {
      throw new RpcException({ code: 404, message: 'Task not found' });
    }

    return Task.create({
      title: task.title,
    });
  }

  @GrpcMethod('TaskService')
  async UpdateTask(request: UpdateTaskRequest): Promise<Task> {
    if (!request.task) {
      throw new RpcException({ code: 400, message: 'Task is required' });
    } else if (isNaN(Number(request.task.id))) {
      throw new RpcException({
        code: 400,
        message: 'Task id must be a number',
      });
    }
    const task = await this.taskService.update(request.task.id, {
      title: request.task.title,
      description: request.task.description,
      status: request.task.status as unknown as StatusFromPrisma,
      dueDate: request.task.dueDate,
    });

    if (!task) {
      throw new RpcException({ code: 404, message: 'Task not found' });
    }

    return Task.create({
      title: task.title,
    });
  }

  @GrpcMethod('TaskService')
  async DeleteTask(request: DeleteTaskRequest): Promise<Task> {
    if (!request.id) {
      throw new RpcException({ code: 400, message: 'Task id is required' });
    } else if (isNaN(Number(request.id))) {
      throw new RpcException({
        code: 400,
        message: 'Task id must be a number',
      });
    }
    const task = await this.taskService.remove(Number(request.id));

    if (!task) {
      throw new RpcException({ code: 404, message: 'Task not found' });
    }

    return Task.create({
      title: task.title,
    });
  }
}
