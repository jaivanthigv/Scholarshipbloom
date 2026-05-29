from recommendation_model import train_model

if __name__ == '__main__':
    print('Training scholarship recommendation model...')
    model_path = train_model()
    print(f'Model trained and saved to {model_path}')
