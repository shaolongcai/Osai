# 1.0.0 需求

## 概要

>- 1.0.0版本，会完全去掉主页面，转为只有快捷搜索的窗口，所以所有的功能需要迁移到快捷启动的搜索窗口中来。
>
>- 另外，后端使用了两个window来承载【设置】跟【搜索】（这样是为了防止设置出现时，整个应用会移位）。
>
>- 并且后续将会以【英文】的视角来设计，其他语种就根据AI翻译，或者之前已存在的中文文案。

![image-0](images\image-0.png)

<center>WindowsManage.ts</center>

### 公用组件

>- 因为会有大量使用Paper或者Card 组件（任意选一），可以抽取一个公用组件，修改样式后全部用这个组件承载。
>
>- 现在逐步使用 tailwindCSS，不再使用.module.scss

## 功能

### 1. 启动界面

>1. 启动时，不再显示主界面，显示一个新的加载界面
>
>2. 可以多做一个window，或者根据search window更改。
>
>3. 可参考在主界面中的加载页面，基本功能一样的。

![image-1](images\image-1.png)

<center>启动中</center>

![image-2](images\image-2.png)

<center>启动失败</center>

### 2. 新手引导

>1. 每一位用户第一次打开（可存入缓存或者数据库），都会弹出新手引导
>
>2. 一共有4步，第4步Button的名称请更改为：“finish”
>
>3. 四步文案分别为：
  a. Osai will remember the files you have opened
  b. Even if you forget the file title, you can still search for its content.
  c. You can install an AI service to allow Osai to remember your files by a powerful AI model.
  d. All content, whether data or AI, is completed locally, with 100% private lock.
>
>4. 指示器每移动一个，则向右边移动一格。
>
>5. 图片参考下方的附件

![image-3](images\image-3.png)

![image-4](images\image-4.png)

<center>第四步</center>

### 3. 用户体验提升计划

>1. 当新手引导，点击【finish】后（即完成四步后），会切换到这个【用户体验提升计划】
>
>2. 每位用户只会弹出一次，用户允许后，后续的日志、报错、设备ID才会上传到我们的服务器
>
>3. 建议放到缓存，这样每次更新都可以询问一次。直到用户【同意】后，才存入数据库。
>
>4. 用户可以在设置中再次关闭或者同意该计划。

![image-5](images\image-5.png)

![image-6](images\image-6.png)

<center>在【设置】中开启该计划后，同样会切换出该提示，允许后才会正式上传</center>

### 4. 索引提示变更

>1. 以前索引提示是在主页面，现在没有了，需要转移到下方的提示栏中

![image-7](images\image-7.png)

### 5. Pro 引导
>1. 新增了搜索按钮 【AI SEARCH】（之前也有一个search，但是实际没用的）。
>
>2. 点击AI Search，如果没有升级到PRO，则弹出这个提示 （📌 因为是否付费要登录账号、检验证书，现在还没有接口，可暂时先设置一个全局变量，恒定为非会员）
>
>3. 点击【Upgrade】跳到官网的价格页面

![image-8](images\image-8.png)

### 6. 设置页面

>1. 重新整理了设置页面。
>
>2. 加入了分组以及 Current Plan的分组
>
>3. Contact，可能会有所修改，可以先放占位图
>
>📌 Login 会跳转到官网并进行谷歌登录（也是暂时唯一的登录方式），但是由于现在还没登录接口，可以暂时放着。

![image-9](images\image-9.png)

####  设置的其他状态

![image-10](images\image-10.png)

### 7. 后端加密方案

现在后端代码太容易被破解了，需要有比较好一点的加密或混淆方案：

>1. 最好不会增加太多体积
>
>2. 最好开源及可商用
>
>3. 不要太多步骤的加密，最好能跟Eletrcon这个库天然融合，打包即加密。

### 8. 更换获取用户程序与图标的方法（可选）
>1. 现在已经获取了用户的程序跟图标，但有些问题：
   a. 程序获取的名称跟别的软件不一样（比如其他搜索器搜索出来的是Trae，但是我们的搜索出来是Trae（User））
      b. 图标有些获取之后会去到左上角。
>
>2. 期望：获取的程序名称较为正常，图标较为正常，最好能够获取到像【Steam】这种不在注册表的应用。

## Bug

- [ ] 切换语言后，通知栏会直接没有了内容
- [ ] 二次开启的锁定失效，仍能打开两个窗口

## 总需求：

- [ ] 付费
  - [ ] 付费引导
  - [ ] 付费提示
  - [ ] 后端付费接口
- [ ] 更新通知迁移
- [ ] 应用内登录
- [ ] 搜索框询问问题 （PRO）
- [ ] 索引变更
  - [ ] 索引最近打开的文件
  - [ ] 索引打开/打开的文件夹文件
  - [ ] 初步索引改为简单索引path、title，type（扩展名）
- [ ] 搜索文档内容
  - [ ] 查找权重更新（找到内容的放上去）
- [ ] 引导
  - [ ] 新手引导
  - [ ] AI服务引导
  - [ ] 用户体验引导
- [ ] 类型筛选
- [ ] 设置更新
- [ ] 后端加密方案
- [ ] 应用谷歌登录
- [ ] 记录用户ID（可选）
- [ ] 更换获取用户程序与图片的方法（可选）
- [ ] 增加多主題