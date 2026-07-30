plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.shnayimmikra.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.shnayimmikra.app"
        minSdk = 26
        targetSdk = 34
        // Override from CI: ./gradlew assembleRelease -PVERSION_CODE=3 -PVERSION_NAME=1.0.2
        versionCode = (project.findProperty("VERSION_CODE") as String?)?.toIntOrNull() ?: 2
        versionName = (project.findProperty("VERSION_NAME") as String?) ?: "1.0.1"
    }

    signingConfigs {
        create("release") {
            val storeFilePath = System.getenv("RELEASE_KEYSTORE_PATH")
                ?: (project.findProperty("RELEASE_KEYSTORE_PATH") as String?)
            if (storeFilePath != null) {
                storeFile = file(storeFilePath)
                storePassword = System.getenv("RELEASE_KEYSTORE_PASSWORD")
                    ?: (project.findProperty("RELEASE_KEYSTORE_PASSWORD") as String?)
                keyAlias = System.getenv("RELEASE_KEY_ALIAS")
                    ?: (project.findProperty("RELEASE_KEY_ALIAS") as String?)
                keyPassword = System.getenv("RELEASE_KEY_PASSWORD")
                    ?: (project.findProperty("RELEASE_KEY_PASSWORD") as String?)
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Consistent release signing lets Android install over the previous APK.
            // Without it, CI debug keystores change every run and updates fail with
            // INSTALL_FAILED_UPDATE_INCOMPATIBLE.
            signingConfig = if (signingConfigs.getByName("release").storeFile != null) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-ktx:1.9.2")
    implementation("androidx.webkit:webkit:1.11.0")
}

// Copy the shared web app (HTML/JS/CSS/data/fonts) into the APK assets before each build,
// so the app is fully offline and the web sources stay in one place.
val webAssetsSrc = rootProject.file("../web")
val webAssetsDst = layout.projectDirectory.dir("src/main/assets")

val copyWebAssets by tasks.registering(Copy::class) {
    description = "Copies the shared web assets from shnayim-mikra/web into app/src/main/assets."
    group = "build"
    from(webAssetsSrc)
    into(webAssetsDst)
}

tasks.named("preBuild") { dependsOn(copyWebAssets) }
tasks.named("clean") {
    doLast { webAssetsDst.asFile.deleteRecursively() }
}
