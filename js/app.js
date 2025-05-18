const viewer = document.getElementById("viewer");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(250, 250);
viewer.appendChild(renderer.domElement);

const loader = new THREE.GLTFLoader();
let currentModel = null;
let dictionary = {};
let isLoading = false;

// إضاءة محسنة
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(2, 2, 5);
scene.add(directionalLight);

// تحميل ملف dictionary
fetch("dictionary.json")
  .then(res => res.json())
  .then(data => {
    dictionary = data;
  });

// تحميل النموذج وضبطه تلقائيًا
function loadModel(url) {
  if (isLoading) return;
  isLoading = true;

  // إزالة النموذج السابق وتفريغ موارده
  if (currentModel) {
    scene.remove(currentModel);
    currentModel.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    currentModel = null;
  }

  loader.load(url, function (gltf) {
    currentModel = gltf.scene;
    currentModel.rotation.y = Math.PI;
    currentModel.scale.set(1.2, 1.2, 1.2);
    scene.add(currentModel);

    // حساب الحجم والمركز
    const box = new THREE.Box3().setFromObject(currentModel);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    currentModel.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.5;
    camera.position.z = cameraZ;

    camera.lookAt(0, 0, 0);
    isLoading = false;
  });
}

// التدوير المستمر للنموذج
function animate() {
  requestAnimationFrame(animate);
  if (currentModel) {
    currentModel.rotation.y += 0.01;
  }
  renderer.render(scene, camera);
}
animate();

// التفاعل مع عناصر الناف بار
document.querySelectorAll(".nav-item,.glb-word").forEach(el => {
  el.addEventListener("mouseenter", () => {
    const word = el.dataset.word;
    const model = dictionary[word];
    if (model) {
      loadModel(model);
      viewer.style.display = "block";
    }
  });

  el.addEventListener("mouseleave", () => {
    viewer.style.display = "none";
  });
});

// تحريك النموذج مع الفأرة
document.addEventListener("mousemove", e => {
  viewer.style.left = `${e.pageX + 15}px`;
  viewer.style.top = `${e.pageY + 15}px`;
});
