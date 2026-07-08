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
        versionCode = 2
        versionName = "1.0.1"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
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
