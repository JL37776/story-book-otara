# Group Seven - Whakatōhea - Te Tahi

An interactive book regarding Te Tahi-o-Te-Rā

---

# Project Workflow

```
Fork → Clone → Create Branch → Work → Push → Pull Request → Review → Merge
```

## Project Structure

```
story-book-otara
│
├── api/           # JSON data for each story page
├── images/        # Illustrations used in the story
├── storybook.html # Main HTML page
├── storybook.css  # Styling for the storybook
└── storybook.js   # Interactive functionality
```
# Team Guidelines

A few simple rules for the team:

- Do not push directly to `main`
- Always create a branch before working
- Write clear commit messages
- Pull the latest changes before starting new work
- Open a pull request when your feature is ready

---

# Getting Started

## 1. Fork the Repository

Click the **Fork** button at the top of this repository.  
This creates your own copy of the project.

---

## 2. Clone Your Fork

Clone your fork to your computer.

```bash
git clone https://github.com/YOUR-USERNAME/story-book-otara.git
```

Move into the project folder:

```bash
cd story-book-otara
```

---

## 3. Connect to the Original Repository

Add the original repository as **upstream** so you can get updates from the team.

```bash
git remote add upstream https://github.com/aliyyanWijaya/story-book-otara.git
```

Check that it worked:

```bash
git remote -v
```

You should see both `origin` and `upstream`.

---

# Working on the Project

## 1. Create a New Branch

Always create a branch before making changes.

Example:

```bash
git checkout -b feature-add-chapter1
```

or

```bash
git checkout -b fix-navigation
```

Try to name your branch based on what you're working on.

---

## 2. Make Your Changes

Edit files, add content, or improve the project.

Then stage and commit your changes:

```bash
git add .
git commit -m "Add chapter 1 story section"
```

---

## 3. Push Your Branch

Push your branch to your fork:

```bash
git push origin your-branch-name
```

Example:

```bash
git push origin feature-add-chapter1
```

---

# Creating a Pull Request

Once your work is ready:

1. Go to the main repository
2. Click **Pull Requests**
3. Click **New Pull Request**
4. Select your branch
5. Submit the pull request

Your changes will be reviewed before being merged into `main`.

---

# Updating Your Local Repository

Before starting new work, make sure you have the latest changes.

```bash
git pull upstream main
```

If needed, update your fork:

```bash
git push origin main
```


