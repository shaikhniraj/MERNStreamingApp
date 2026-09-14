// Jenkinsfile
// A declarative Jenkins Pipeline: defines every stage Jenkins runs when this job executes.

pipeline {
    // Run on any available Jenkins agent — we don't need a specific machine/label for this project
    agent any

    // Environment variables available to every stage below
    environment {
        AWS_ACCOUNT_ID = '586917955726'                                          // Your AWS account ID — used to build the ECR hostname
        AWS_REGION     = 'us-east-1'                                             // Region where Terraform created your ECR repos
        ECR_REGISTRY   = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com" // Full ECR registry URL, built from the two values above
        IMAGE_TAG      = "1.0.${BUILD_NUMBER}"                                   // Unique tag per run, using Jenkins' auto-incrementing build number
    }

    stages {
        stage('Checkout') {
            steps {
                // Pulls the code from whatever repo/branch this Jenkins job is pointed at
                checkout scm
            }
        }

        stage('Build & Push Images') {
            steps {
                script {
                    // One entry per microservice: its ECR repo suffix, Docker build context,
                    // and Dockerfile path — mirrors the docker build commands from your assignment guide
                    def services = [
                        [name: 'auth',      context: 'backend/authService', dockerfile: 'backend/authService/Dockerfile'],
                        [name: 'streaming', context: 'backend',             dockerfile: 'backend/streamingService/Dockerfile'],
                        [name: 'admin',     context: 'backend',             dockerfile: 'backend/adminService/Dockerfile'],
                        [name: 'chat',      context: 'backend',             dockerfile: 'backend/chatService/Dockerfile'],
                        [name: 'frontend',  context: 'frontend',            dockerfile: 'frontend/Dockerfile'],
                    ]

                    // docker.withRegistry, combined with the Amazon ECR plugin, understands the
                    // special credential format "ecr:<region>:<jenkins-credential-id>". It uses
                    // your stored AWS Credentials to fetch a short-lived ECR login token automatically —
                    // no manual `aws ecr get-login-password` / `docker login` needed.
                    docker.withRegistry("https://${ECR_REGISTRY}", "ecr:${AWS_REGION}:aws-ecr-creds") {

                        // Loop over each service, building then immediately pushing its image
                        services.each { svc ->
                            def repoName  = "streamingapp/${svc.name}"          // Must match the ECR repo names Terraform created
                            def fullImage = "${ECR_REGISTRY}/${repoName}:${IMAGE_TAG}"

                            echo "Building ${svc.name} -> ${fullImage}"

                            // docker.build(tag, "-f <dockerfile> <context>") builds the image
                            // using this service's specific Dockerfile and build context
                            def image = docker.build(fullImage, "-f ${svc.dockerfile} ${svc.context}")

                            // .push() uploads the just-built image to ECR, inside the auth session opened above
                            image.push()
                        }
                    }
                }
            }
        }
    }

    // Runs after all stages, regardless of outcome — a hook point for notifications later (e.g. the bonus SNS/ChatOps step)
    post {
        always {
            echo "Pipeline finished for build ${IMAGE_TAG}"
        }
        success {
            echo "All 5 images pushed successfully to ECR."
        }
        failure {
            echo "Pipeline failed — check the stage logs above for which service broke."
        }
    }
}