# Batch Connect - Jupyter Notebook with Repo Cloning

This Open OnDemand app launches a Jupyter Notebook server inside a container, with automatic cloning (or updating) of a specified Git repository into your home directory. It is designed for interactive data analysis and reproducible research workflows.

## Features
- Jupyter Notebook server runs in a secure container (Apptainer/Singularity)
- Automatically clones or updates a Git repository (e.g., for code, notebooks, or data)
- Customizable SLURM resource requests (cores, memory, partition, etc.)
- Secure, token-based access

## How it works
- When you launch a session, the app will:
  1. Clone the repository to `$HOME/dianne-codebase` if it does not exist, or `git pull` to update it if it does.
  2. Start a Jupyter Notebook server inside the specified container, accessible via your browser.

## Usage
1. Select your desired resources (partition, cores, memory, time) in the launch form.
2. Click **Launch** to start your session.
3. Once the job starts, click **Connect** to open Jupyter in your browser.
4. Your cloned repository will be available at `$HOME/dianne-codebase`.

## Customization
- To change the repository, edit the repo URL in `template/before.sh.erb`.
- To change the container, update the `CONTAINER` variable in the same file.
- To change the default notebook directory, update `NOTEBOOK_DIR`.

## Support
For help, contact your system administrator or see the info/help page in the app.
