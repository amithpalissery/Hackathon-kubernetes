### **Project Deployment Documentation: CI/CD with Kubernetes on EC2**

This repository documents a robust CI/CD pipeline for a static web application, deployed to a self-hosted Kubernetes cluster running on an AWS EC2 instance. The entire process, from code commit to production deployment, is automated using GitHub Actions.

#### **Project Overview**

The goal of this project was to create a production-grade deployment pipeline for a simple web application while keeping costs low and maintaining full control over the infrastructure.

  - **Application:** A static web application served by Nginx.
  - **Infrastructure:** AWS EC2 instance running a self-hosted Kubernetes cluster.
  - **Containerization:** Docker for packaging the application.
  - **CI/CD:** GitHub Actions with a self-hosted runner for automated build, security scanning, and deployment.
  - **Orchestration:** Kubernetes for managing the application's lifecycle, auto-recovery, and external access.

-----

### **Architecture Diagram**

```
[GitHub Repository]
     |
     | (Push Event)
     |
[GitHub Actions Workflow] --> [EC2 Instance (Self-Hosted Runner)]
     |                               |
     |                               | 1. Lint & Test Code (ESLint, CodeQL)
     |                               | 2. Build Docker Image (Trivy Scan)
     |                               | 3. Push Image to Docker Hub
     |                               | 4. Deploy to Kubernetes
     |                               |
     |                             [Kubernetes Cluster on EC2]
     |                                   |
     |                                   |--> [Deployment (Nginx Pod)]
     |                                   |--> [Service (NodePort)]
     |                                         |
     |                                         | (Traffic on port 30080)
                                            [EC2 Public IP]
                                                 |
                                                 | (iptables redirect)
                                                 V
                                         [http://<EC2-IP>]
                                        |
                                        |5. DAST scan
```

-----

### **1. Infrastructure Setup**

The deployment environment is built on a single **Ubuntu EC2 instance**.

  - **AWS EC2:** An Ubuntu virtual machine serves as both the Kubernetes master and the GitHub Actions self-hosted runner.
  - **Docker:** Used to build the application container.
  - **Kubernetes:** A cluster was provisioned using `kubeadm` to orchestrate the container.
  - **GitHub Actions Runner:** Installed on the EC2 instance, it provides the CI/CD pipeline with direct access to the local Docker and Kubernetes environments.

-----

### **2. Docker Image**

The static web application is packaged into a Docker image.

  - **Base Image:** `nginx:alpine` was chosen for its small size and high performance in serving static content.
  - **Registry:** The final image is tagged and pushed to **Docker Hub** for easy access by the Kubernetes cluster.
  - **Image Name:** `amithpalissery/hackathon:latest`

-----

### **3. Kubernetes Deployment**

The application is deployed using a Kubernetes manifest (`k8s-manifest.yaml`).

  - **Deployment:** Manages a single replica of the Nginx pod, ensuring the application is always running and automatically recovers from failures.
  - **Service:** A **`NodePort`** service exposes the Nginx pod on port `30080` of the EC2 instance, making it accessible from the internet.

-----


---

### **4. CI/CD Pipeline**

A single GitHub Actions workflow (`.github/workflows/main.yml`) automates the entire process.

1.  **Code Quality & Security:**
    -   **Linting:** `ESLint` for code consistency.
    -   **Vulnerability Scanning:** `CodeQL` for static code analysis.
2.  **Container Build & Push:**
    -   Builds the Docker image.
    -   Scans the image for vulnerabilities using **Trivy**.
3.  **Deployment:**
    -   Deploys the application to the Kubernetes cluster using `kubectl apply`.
4.  **Security Testing:**
    -   Performs a **passive DAST scan** on the deployed application to identify security vulnerabilities. This type of scan analyzes the application's responses and headers without actively sending malicious payloads. It's a non-intrusive way to find issues like misconfigurations or exposed information.
-----

### **5. Accessing the Application**

The application can be accessed via two methods:

  - **Directly via NodePort:** `http://<EC2-IP>:30080`
  - **Standard HTTP:** An `iptables` rule on the EC2 instance redirects traffic from port 80 to 30080.
      - `sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 30080`
      - Access the application at `http://<EC2-IP>`

-----

### **Next Steps & Improvements**

  - **Resilience:** Add `livenessProbe` and `readinessProbe` to the Kubernetes deployment for more robust health checks.
  - **Scalability:** Implement the **Horizontal Pod Autoscaler (HPA)** to automatically scale the number of pods based on CPU usage.
  - **Templating:** Migrate the Kubernetes manifest to **Helm Charts** for easier management and versioning of deployments.
  - **GitOps:** Explore using a GitOps tool like **ArgoCD** to manage deployments declaratively.
