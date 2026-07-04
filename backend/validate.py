import json
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import precision_recall_fscore_support, classification_report, confusion_matrix

def compute_validation_metrics(y_true, y_pred):
    print("[*] Computing validation metrics (Scikit-Learn)...")
    
    if hasattr(y_true, 'to_numpy'):
        y_true = y_true.to_numpy()
    if hasattr(y_pred, 'to_numpy'):
        y_pred = y_pred.to_numpy()
        
    precision, recall, f1_score, _ = precision_recall_fscore_support(
        y_true, y_pred, average='weighted', zero_division=0
    )
    
    report_dict = classification_report(y_true, y_pred, output_dict=True, zero_division=0)
    
    metrics = {
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1_score),
        "per_class_report_json": json.dumps(report_dict)
    }
    
    print(f"[*] Validation Complete. Weighted F1: {f1_score:.4f}")
    return metrics

def save_confusion_matrix(y_true, y_pred, output_path):
    print(f"[*] Generating confusion matrix PNG at {output_path}...")
    
    if hasattr(y_true, 'to_numpy'):
        y_true = y_true.to_numpy()
    if hasattr(y_pred, 'to_numpy'):
        y_pred = y_pred.to_numpy()
        
    labels = sorted(list(set(y_true).union(set(y_pred))))
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    
    plt.figure(figsize=(12, 10))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=labels, yticklabels=labels)
    plt.title('NetworkGuard Confusion Matrix (CIC-IDS2017)')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()
    
    print("[*] Confusion matrix saved successfully.")
