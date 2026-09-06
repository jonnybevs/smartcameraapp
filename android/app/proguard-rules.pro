# Add project specific ProGuard rules here.

# TensorFlow Lite
-keep class org.tensorflow.lite.** { *; }
-keep interface org.tensorflow.lite.** { *; }

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Keep native methods
-keepclassmembers class * {
    native <methods>;
}

# Keep custom modules
-keep class com.smartcameraapp.** { *; }
