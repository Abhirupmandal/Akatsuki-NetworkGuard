import time
import pandas as pd
import numpy as np

try:
    from cuml.ensemble import RandomForestClassifier
    from cuml.cluster import DBSCAN
    from cuml.model_selection import train_test_split
    CUML_AVAILABLE = True
except ImportError:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.cluster import DBSCAN
    from sklearn.model_selection import train_test_split
    CUML_AVAILABLE = False

def train_classifier(X, y):
    print(f"[*] Training RandomForestClassifier (Backend: {'cuML' if CUML_AVAILABLE else 'sklearn'})...")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    start_time = time.time()
    
    if CUML_AVAILABLE:
        X_train = X_train.astype('float32')
        X_test = X_test.astype('float32')
        clf = RandomForestClassifier(n_estimators=100, max_depth=16, random_state=42)
    else:
        clf = RandomForestClassifier(n_estimators=100, max_depth=16, class_weight='balanced', random_state=42, n_jobs=-1)
        
    clf.fit(X_train, y_train)
    
    end_time = time.time()
    train_time = end_time - start_time
    print(f"[*] Model trained in {train_time:.2f} seconds.")
    
    y_pred = clf.predict(X_test)
    
    try:
        y_prob = clf.predict_proba(X)
        if hasattr(y_prob, 'max'):
            confidence = y_prob.max(axis=1)
        else:
            confidence = pd.Series([0.9] * len(X))
    except AttributeError:
        confidence = pd.Series([0.9] * len(X)) 
        
    return clf, train_time, X_test, y_test, y_pred, confidence


def run_anomaly_detection(df, features):
    print(f"[*] Running DBSCAN anomaly detection (Backend: {'cuML' if CUML_AVAILABLE else 'sklearn'})...")
    
    X_subset = df[features].copy()
    X_subset = X_subset.fillna(0)
    
    if CUML_AVAILABLE:
        X_subset = X_subset.astype('float32')
        
    dbscan = DBSCAN(eps=0.5, min_samples=10)
    
    start_time = time.time()
    cluster_labels = dbscan.fit_predict(X_subset)
    end_time = time.time()
    
    print(f"[*] DBSCAN completed in {end_time - start_time:.2f} seconds.")
    
    if hasattr(cluster_labels, 'to_pandas'):
        cluster_labels = cluster_labels.to_pandas()
        
    is_anomaly = (cluster_labels == -1).astype(int)
    print(f"[*] Detected {is_anomaly.sum()} anomalous flows out of {len(is_anomaly)}.")
    
    return is_anomaly


def get_feature_importances(model, feature_names):
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
        if hasattr(importances, 'to_numpy'):
            importances = importances.to_numpy()
            
        feature_importance_list = [
            {"name": name, "importance": float(imp)}
            for name, imp in zip(feature_names, importances)
        ]
        feature_importance_list.sort(key=lambda x: x["importance"], reverse=True)
        return feature_importance_list
    return []
