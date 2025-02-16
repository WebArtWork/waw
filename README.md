# waw Framework

waw is a minimalistic Node.js framework that serves as a foundation for building various types of projects. The core framework itself contains almost no code—its functionality is driven entirely by the modules you choose to include, making it highly flexible and adaptable to different use cases.

## Key Features

-   **Minimal Core** – The framework itself is extremely lightweight, containing only the essential bootstrapping logic. All functionality is added through modules, keeping the core clean and adaptable.
-   **Modular Architecture** – Functionality is added via modules, allowing you to build projects tailored to your specific needs.
-   **Full-Stack Support** – Supports modern front-end frameworks and powerful back-end technologies.
-   **Flexible Integration** – Can be extended to work with any front-end or back-end technology by developing custom modules.

## Supported Frameworks

-   Angular
-   React
-   Vue
-   Unity

## Default Back-End Setup

By default, waw uses the following technologies for back-end development:

-   **Express.js** – A fast, minimalist web framework for Node.js.
-   **Socket.io** – Real-time, bidirectional event-based communication.
-   **MongoDB** – A flexible, scalable NoSQL database.

However, waw is designed to be flexible, and you can integrate any other back-end technologies or databases by writing custom modules.

## Getting Started

### 1. Install waw

Ensure you have Node.js installed, then install waw globally:

```sh
npm install -g waw
```

### 2. Verify Installation

Check if waw is installed correctly by running:

```sh
waw version
```

### 3. Create a New Project

To initialize a new project, use the command:

```sh
waw new project-name
```

### 4. Start Your Project

Run the project using:

```sh
waw
```

For production environments, use PM2:

```sh
waw start
```

### 5. Sync Modules

To fetch modules from GitHub based on their repository link in the `module.json` file, use:

```sh
waw sync
```

### 6. Update waw

To ensure you're using the latest version of waw and its modules, update it with:

```sh
waw update
```

## Module System

waw supports two types of modules:

-   **Global Modules** – These modules are shared across multiple projects. Each project decides which global modules to include.
-   **Local Modules** – These modules exist only within a specific project and can be modified as needed. A global module can also be converted into a local module for customization.

## Default Modules

waw comes with some foundational modules that provide essential functionality for different types of projects. These default modules help streamline development, but they are not mandatory—developers can choose to use different modules or create their own based on project requirements. You are not restricted to these modules and can swap them for other technologies depending on the needs of your project.

## CLI Modules

waw also provides CLI tools for generating back-end projects and modules:

-   [waw-core](https://github.com/WebArtWork/waw-core) – CLI tool for generating projects, fetching code from repositories, and creating basic modules.
-   [waw-sem](https://github.com/WebArtWork/waw-sem) – CLI tool for generating back-end modules using Express, Socket.io, and Mongoose.

For front-end integrations, waw provides dedicated CLI modules:

-   [waw-angular](https://github.com/WebArtWork/waw-angular) – CLI support for Angular projects.
-   [waw-react](https://github.com/WebArtWork/waw-react) – CLI support for React projects.
-   [waw-vue](https://github.com/WebArtWork/waw-vue) – CLI support for Vue projects.
-   [waw-unity](https://github.com/WebArtWork/waw-unity) – CLI support for Unity-based applications.

## Why Use waw?

-   **Lightweight and Fast** – You only include what you need, avoiding unnecessary bloat.
-   **Highly Scalable** – Perfect for small projects and large-scale applications alike.
-   **Modular Flexibility** – Swap and combine modules to fit your project’s requirements.
-   **Full-Stack Ready** – Easily integrate with the latest front-end frameworks and back-end services.
-   **Extendable** – Can be connected to any front-end or back-end technology by writing the necessary modules.

## Contributing

We welcome contributions! Whether it's improving the waw framework or enhancing any of our public modules, your help is greatly appreciated. Feel free to fork the repository, submit issues, or create pull requests. If you have an idea for a new module, we'd love to see it!

## License

waw is open-source and available under the MIT License.
