<template>
  <div>
    <h1>Upload Image</h1>
    <input type="file" ref="fileInput" @change="handleFileChange" multiple />
    <button @click="uploadFiles">Upload</button>
    <div v-if="uploadUrls.length">
      <p>Uploaded files:</p>
      <ul>
        <li v-for="url in uploadUrls" :key="url">
          <a :href="url" target="_blank">{{ url }}</a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const fileInput = ref(null);
const uploadUrls = ref([]);

const handleFileChange = (event) => {
  // Update file input reference
  fileInput.value = event.target.files;
};

const uploadFiles = async () => {
  try {
    // Check if files are selected
    if (!fileInput.value.length) {
      alert('Please select files first!');
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < fileInput.value.length; i++) {
      formData.append('files', fileInput.value[i]);
    }

    const { data } = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    uploadUrls.value = data.map(file => file.webViewLink);
  } catch (error) {
    console.error('Error uploading files:', error);
    alert('An error occurred while uploading the files. Please try again later.');
  }
};
</script>
