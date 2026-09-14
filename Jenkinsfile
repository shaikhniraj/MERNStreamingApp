//jenkins file 
// Declearative jenkins pipeline    
pipeline {

    // Run on any available agent
    agent any

    // Environment variables available for the pipeline
    environment {
        AWS_ACCOUNT_ID = '586917955726' // Your AWS account ID — used to build the ECR hostname
        AWS_REGION = 'us-east-1' // Your AWS region
        ECR_REGISTERY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com" // Your ECR registry URL
        IMAGE_TAG = "1.0.${BUILD_NUMBER}"

    }
    // Define the stages of the pipeline
    stages { 
        stage ('checkout') {
            steps {
                //Pulls the code from wathever repo/branch is configured in the Jenkins job
                checkout scm
            }
    }
    stage ('Build and Push Image') {
        steps { 
            script { 
                //One entry per microservice to build and push Docker images to ECR
                def service = [
                    [name: 'auth', context: 'backend/authService', dockerfile: 'backend/authService/Dockerfile' ],
                    [name: 'streaming', context: 'backend/streamingService', dockerfile: 'backend/streamingService/Dockerfile'],
                    [name: 'admin', context: 'backend/adminService', dockerfile: 'backend/adminService/Dockerfile'],
                    [name: 'chat', context: 'backend/chatService', dockerfile: 'backend/chatService/Dockerfile'],
                    [name: 'frontend', context: 'frontend', dockerfile: 'frontend/Dockerfile']
           
                ]

                // docker.withRegistry, combined with the Amazon ECR plugin, understands the
                // special credential format "ecr:<region>:<jenkins-credential-id>". It uses
                // your stored AWS Credentials to fetch a short-lived ECR login token automatically —
                // no manual `aws ecr get-login-password` / `docker login` needed.
                docker.withRegistry("https://${ECR_REGISTERY}", "ecr:${AWS_REGION}:aws-ecr-creds") {
                    //loop over each service and build/push the Docker image
                    service.each { svc -> 
                        def reponame = "streamingapp/${svc.name}"  // Must match the ECR repo names Terraform created
                        def fullimage = "${ECR_REGISTERY}/${reponame}:${IMAGE_TAG}"

                        echo "Building: ${svc.name} -> ${fullimage}"
                        // docker.build(tag, "-f <dockerfile> <context>") builds the image
                        // using this service's specific Dockerfile and build context
                        def image = docker.build(fullimage, "-f ${svc.dockerfile} ${svc.context}")
                        // .push() uploads the just-built image to ECR, inside the auth session opened above
                        image.push()
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